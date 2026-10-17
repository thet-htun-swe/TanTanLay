// =============================================================================
// TanTanLay - Edge Function "manage-users" (staff accounts, admin only)
//
// Runs on Supabase, not in the app. Creating or changing login accounts needs
// the service_role key; Supabase gives it to Edge Functions automatically
// (SUPABASE_SERVICE_ROLE_KEY), so it never goes into the app or this repo.
//
// Every request must come from a signed-in ADMIN (checked below).
//
// Deploy: Supabase dashboard -> Edge Functions -> Deploy a new function ->
// Via Editor -> name it exactly "manage-users" -> paste this file -> Deploy.
//
// Request body (POST, JSON):
//   { "action": "list" }
//   { "action": "create", "email", "password", "fullName", "role": "staff"|"admin" }
//   { "action": "update", "userId", "fullName"?, "role"?, "password"?, "disabled"? }
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MIN_PASSWORD_LENGTH = 6;
// Disabled = banned for ~100 years (Supabase has no "forever")
const DISABLED_BAN = "876000h";

type Role = "admin" | "staff";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Errors we show to the admin as they are
class UserError extends Error {}

const isRole = (value: unknown): value is Role => value === "admin" || value === "staff";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // 1. Who is calling? (their login token from the app)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: caller } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!caller?.user) return json({ error: "Please sign in again." }, 401);

  // 2. Only admins may manage accounts
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.user.id)
    .maybeSingle();
  if (callerProfile?.role !== "admin") {
    return json({ error: "Only an admin can manage staff accounts." }, 403);
  }

  try {
    const body = await req.json().catch(() => ({}));

    switch (body.action) {
      case "list":
        return json({ users: await listUsers(admin) });
      case "create":
        return json({ user: await createUser(admin, body) });
      case "update":
        await updateUser(admin, caller.user.id, body);
        return json({ ok: true });
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("manage-users:", message);
    return json({ error: message }, error instanceof UserError ? 400 : 500);
  }
});

// deno-lint-ignore no-explicit-any
type AdminClient = any;

async function listUsers(admin: AdminClient) {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const { data: profiles, error } = await admin.from("profiles").select("id, full_name, role");
  if (error) throw error;
  const profileById = new Map(profiles.map((p: { id: string }) => [p.id, p]));

  const now = Date.now();
  return users
    .map((user: {
      id: string;
      email?: string;
      banned_until?: string | null;
      last_sign_in_at?: string | null;
      created_at: string;
    }) => {
      const profile = profileById.get(user.id) as { full_name: string | null; role: Role } | undefined;
      return {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? "",
        role: profile?.role ?? "staff",
        disabled: !!user.banned_until && new Date(user.banned_until).getTime() > now,
        lastSignInAt: user.last_sign_in_at ?? null,
        createdAt: user.created_at,
      };
    })
    .sort((a: { fullName: string; email: string }, b: { fullName: string; email: string }) =>
      (a.fullName || a.email).localeCompare(b.fullName || b.email),
    );
}

async function createUser(admin: AdminClient, body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const fullName = String(body.fullName ?? "").trim();
  const role = isRole(body.role) ? body.role : "staff";

  if (!fullName) throw new UserError("Enter the person's name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("Enter a valid email address.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new UserError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  // email_confirm: true = can log in straight away (no confirmation email)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      throw new UserError("An account with this email already exists.");
    }
    throw new UserError(error.message);
  }

  // The new-user trigger made the profile (role 'staff'); set name and role
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, role })
    .eq("id", data.user.id);
  if (profileError) throw profileError;

  return { id: data.user.id, email, fullName, role, disabled: false };
}

async function updateUser(admin: AdminClient, callerId: string, body: Record<string, unknown>) {
  const userId = String(body.userId ?? "");
  if (!userId) throw new UserError("Missing user.");
  const isSelf = userId === callerId;

  // Never lock yourself out
  if (isSelf && body.role === "staff") throw new UserError("You cannot remove your own admin role.");
  if (isSelf && body.disabled === true) throw new UserError("You cannot disable your own account.");

  const profileChanges: Record<string, unknown> = {};
  if (body.fullName !== undefined) {
    const fullName = String(body.fullName).trim();
    if (!fullName) throw new UserError("Enter the person's name.");
    profileChanges.full_name = fullName;
  }
  if (body.role !== undefined) {
    if (!isRole(body.role)) throw new UserError("Unknown role.");
    profileChanges.role = body.role;
  }
  if (Object.keys(profileChanges).length) {
    const { error } = await admin.from("profiles").update(profileChanges).eq("id", userId);
    if (error) throw error;
  }

  const authChanges: Record<string, unknown> = {};
  if (body.password !== undefined) {
    const password = String(body.password);
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new UserError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    authChanges.password = password;
  }
  if (body.disabled !== undefined) authChanges.ban_duration = body.disabled ? DISABLED_BAN : "none";
  if (profileChanges.full_name) authChanges.user_metadata = { full_name: profileChanges.full_name };

  if (Object.keys(authChanges).length) {
    const { error } = await admin.auth.admin.updateUserById(userId, authChanges);
    if (error) throw new UserError(error.message);
  }
}
