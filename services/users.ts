import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { NoConnectionError } from "@/services/api";
import { Role } from "@/types";

// Staff accounts (admin only), through the "manage-users" Edge Function
// (supabase/functions/manage-users). The function holds the secret key; the
// app only sends the admin's login.

export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  disabled: boolean;
  lastSignInAt?: string | null;
  createdAt?: string;
}

export interface NewStaffUser {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

export interface StaffUserChanges {
  fullName?: string;
  role?: Role;
  password?: string;
  disabled?: boolean;
}

export const MIN_PASSWORD_LENGTH = 6;

const call = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("manage-users", { body });
  if (!error) return data as T;

  if (error instanceof FunctionsFetchError) throw new NoConnectionError();
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    if (response.status === 404) {
      throw new Error(
        'Staff accounts are not set up yet. Deploy the "manage-users" function in Supabase.',
      );
    }
    const details = await response.json().catch(() => null);
    throw new Error(details?.error || "Could not complete the request.");
  }
  throw new Error(error.message || "Could not complete the request.");
};

export const listStaffUsers = async () =>
  (await call<{ users: StaffUser[] }>({ action: "list" })).users;

export const createStaffUser = async (user: NewStaffUser) =>
  (await call<{ user: StaffUser }>({ action: "create", ...user })).user;

export const updateStaffUser = async (userId: string, changes: StaffUserChanges) => {
  await call<{ ok: true }>({ action: "update", userId, ...changes });
};
