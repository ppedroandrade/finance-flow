import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
  const csp = [
    "default-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")}`.trim(),
    "worker-src 'self' blob:", "manifest-src 'self'",
    ...(process.env.NODE_ENV === "development" ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const secure = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const isPublic = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/api/health";
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return secure(NextResponse.redirect(url));
    }
    return secure(NextResponse.next({ request: { headers: requestHeaders } }));
  }
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { data: assurance } = user ? await supabase.auth.mfa.getAuthenticatorAssuranceLevel() : { data: null };
  const needsMfa = assurance?.currentLevel === "aal1" && assurance.nextLevel === "aal2";
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (user && ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unauthorized");
    return secure(NextResponse.redirect(url));
  }
  const isAuthPage = request.nextUrl.pathname === "/login";
  const isHealthCheck = request.nextUrl.pathname === "/api/health";
  if ((!user || needsMfa) && !isAuthPage && !isHealthCheck) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return secure(NextResponse.redirect(url));
  }
  if (user && isAuthPage && !needsMfa) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return secure(NextResponse.redirect(url));
  }
  return secure(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
