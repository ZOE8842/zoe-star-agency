// Auth-Middleware: Refreshed Supabase-Session bei jedem Request,
// schützt /portal/* Routes vor unauthenticated Access.

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public-Routes: kein Auth nötig
  const publicPaths = ["/portal/login", "/portal/signup", "/portal/forgot-password", "/portal/reset-password"];
  const isPublicPortalPath = publicPaths.some(p => path.startsWith(p));

  // /portal/* (außer Public-Auth-Pages) erfordert Login
  if (path.startsWith("/portal") && !isPublicPortalPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Wenn eingeloggt + auf Login-Page → redirect zu Dashboard
  if (user && (path === "/portal/login" || path === "/portal/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};
