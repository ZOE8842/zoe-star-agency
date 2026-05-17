// Auth-Middleware: Refreshed Supabase-Session bei jedem Request,
// schützt /portal/* Routes vor unauthenticated Access.
//
// Phase-10-Erweiterung: Berechnet zusaetzlich die Public-Locale (Cookie →
// Accept-Language → 'de') und reicht sie als x-zoe-locale Request-Header
// an Server-Components weiter. Damit muss kein Server-Component mehr
// cookies()/headers() direkt fuer Locale-Detection lesen.

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["de", "en", "fr", "tr", "pt", "ar"] as const;
const DEFAULT_LOCALE = "de";
const LOCALE_COOKIE = "zoe_public_lang";
const LOCALE_HEADER = "x-zoe-locale";

function detectLocale(request: NextRequest): string {
  // 1) Cookie
  const cookieVal = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieVal && (SUPPORTED_LOCALES as readonly string[]).includes(cookieVal)) {
    return cookieVal;
  }
  // 2) Accept-Language (alle Praeferenzen iterieren)
  const al = request.headers.get("accept-language");
  if (al) {
    const prefs = al.split(",")
      .map((p) => p.split(";")[0].trim().split("-")[0].toLowerCase())
      .filter(Boolean);
    for (const p of prefs) {
      if ((SUPPORTED_LOCALES as readonly string[]).includes(p)) {
        return p;
      }
    }
  }
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  // Public-Locale fuer alle Routes berechnen + als Header forwarden.
  const locale = detectLocale(request);
  request.headers.set(LOCALE_HEADER, locale);

  const path = request.nextUrl.pathname;

  // Codex-P2-Fix: Supabase-Auth-Lookup NUR fuer /portal Routes.
  // Public-Pages (Homepage, /agency, /join etc.) brauchen kein
  // auth.getUser → kein extra Supabase-Roundtrip pro Public-Render.
  if (!path.startsWith("/portal")) {
    return NextResponse.next({ request });
  }

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
  // Matcher umfasst /portal (Auth) UND alle anderen Routes (Locale-Header).
  // Exclude: API-Routes, _next-Assets, /studio, sitemap/robots, favicon.
  matcher: [
    "/((?!api|_next|studio|sitemap.xml|robots.txt|favicon.ico|brand|icon|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.webp).*)",
  ],
};
