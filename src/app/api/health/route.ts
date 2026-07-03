import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json({
      status: "error",
      configured: false,
      authReachable: false,
      databaseReachable: false,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    }, { status: 503 });
  }

  try {
    const headers = { apikey: key };
    const [authResponse, databaseResponse] = await Promise.all([
      fetch(`${url}/auth/v1/settings`, { headers, cache: "no-store", signal: AbortSignal.timeout(5000) }),
      fetch(`${url}/rest/v1/categories?select=id&limit=1`, { headers, cache: "no-store", signal: AbortSignal.timeout(5000) }),
    ]);
    const authReachable = authResponse.ok;
    // 401/403 is expected before login because anon has no table privileges.
    const databaseReachable = databaseResponse.ok || databaseResponse.status === 401 || databaseResponse.status === 403;
    const healthy = authReachable && databaseReachable;

    return NextResponse.json({
      status: healthy ? "ok" : "error",
      configured: true,
      authReachable,
      databaseReachable,
      anonymousAccessBlocked: databaseResponse.status === 401 || databaseResponse.status === 403,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    }, { status: healthy ? 200 : 503 });
  } catch {
    return NextResponse.json({
      status: "error",
      configured: true,
      authReachable: false,
      databaseReachable: false,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    }, { status: 503 });
  }
}
