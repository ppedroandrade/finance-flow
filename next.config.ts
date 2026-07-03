import type { NextConfig } from "next";

// The Vercel + Supabase integration prefixes every variable with the project
// name (e.g. `financeflow_SUPABASE_URL`, `NEXT_PUBLIC_financeflow_SUPABASE_ANON_KEY`),
// so match by suffix instead of relying on one exact name.
function findEnvValue(...suffixPatterns: RegExp[]): string | undefined {
  for (const pattern of suffixPatterns) {
    const match = Object.entries(process.env).find(([key, value]) => pattern.test(key) && value);
    if (match) return match[1];
  }
  return undefined;
}

const supabaseUrl = findEnvValue(/(^|_)SUPABASE_URL$/);
const supabasePublishableKey = findEnvValue(/(^|_)SUPABASE_ANON_KEY$/, /(^|_)SUPABASE_PUBLISHABLE_KEY$/);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Only the URL and the public/anon key are exposed here — both are safe for
  // the browser. SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY are never matched.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublishableKey,
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    }];
  },
};

export default nextConfig;
