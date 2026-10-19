// Addresses tested by Settings / Login > "Check connection".
//
// Goal: find which hosting the shop's network can reach from the APP (the
// phone browser can take a different route), before paying for a proxy.
// "Reachable" = the address answered anything (even an error page); only
// "timed out" / "failed" mean blocked or broken.
//
// To try a new proxy address without a new build, use the screen's "Test
// another address" box. To include it in every check, add it to the
// "Candidate proxies" group below (needs a new build).

export type ConnectionTestKind =
  | "http-get" // any HTTP answer = reachable
  | "supabase-health" // must get Supabase's own answer (HTTP 200) through the address
  | "auth-post" // POST like a real sign-in (no real account used)
  | "websocket"; // live updates (Supabase Realtime)

export interface ConnectionTest {
  id: string;
  name: string;
  kind: ConnectionTestKind;
  url: string; // for "auth-post" and "websocket": the server base URL
}

export interface ConnectionTestGroup {
  title: string;
  hint: string;
  tests: ConnectionTest[];
}

// Direct Supabase project address (not secret; the app normally goes through the proxy)
const SUPABASE_DIRECT_URL = "https://zulteqlxedmtabdnivxi.supabase.co";

// "Test another address": checks that a proxy address really passes everything
// through to Supabase (not just that it answers)
export const customServerTests = (baseUrl: string): ConnectionTest[] => [
  { id: "custom-health", name: "Reaches Supabase", kind: "supabase-health", url: baseUrl },
  { id: "custom-auth", name: "Sign-in request", kind: "auth-post", url: baseUrl },
  { id: "custom-ws", name: "Live updates", kind: "websocket", url: baseUrl },
];

// "abc.cloudfront.net" -> "https://abc.cloudfront.net"; null if not a valid address
export const normalizeServerUrl = (input: string): string | null => {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return null;
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
};

export const connectionTestGroups = (serverUrl: string): ConnectionTestGroup[] => [
  {
    title: "This app's server",
    hint: "What the app uses now. All three must be reachable to sign in and get live updates.",
    tests: [
      { id: "server-ping", name: "Server ping", kind: "http-get", url: `${serverUrl}/ping` },
      { id: "server-auth", name: "Sign-in request", kind: "auth-post", url: serverUrl },
      { id: "server-ws", name: "Live updates", kind: "websocket", url: serverUrl },
    ],
  },
  {
    title: "Supabase direct",
    hint: "Without the proxy.",
    tests: [
      {
        id: "supabase-direct",
        name: "supabase.co",
        kind: "http-get",
        url: `${SUPABASE_DIRECT_URL}/auth/v1/health`,
      },
    ],
  },
  {
    title: "Cloudflare with own domains",
    hint: "If these work but the server above does not, a custom domain on Cloudflare will likely work.",
    tests: [
      { id: "cf-cloudflare", name: "cloudflare.com", kind: "http-get", url: "https://www.cloudflare.com/cdn-cgi/trace" },
      { id: "cf-npm", name: "npmjs.com", kind: "http-get", url: "https://www.npmjs.com/cdn-cgi/trace" },
    ],
  },
  {
    title: "Other hosting",
    hint: "Where another proxy could run.",
    tests: [
      { id: "google-apis", name: "Google Cloud (googleapis.com)", kind: "http-get", url: "https://www.googleapis.com/discovery/v1/apis" },
      { id: "aws-cloudfront", name: "AWS CloudFront (cloudfront.net)", kind: "http-get", url: "https://d2908q01vomqb2.cloudfront.net/" },
      { id: "deno", name: "Deno Deploy (deno.com)", kind: "http-get", url: "https://deno.com/" },
    ],
  },
  {
    title: "Candidate proxies",
    hint: "Test proxies you set up. Add their addresses in constants/connectionTests.ts.",
    tests: [],
  },
];
