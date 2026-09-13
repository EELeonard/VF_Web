import { NextRequest, NextResponse } from "next/server";
import { previewCookieName, validPreviewToken } from "./app/lib/preview-auth";

const PUBLIC_PATHS = ["/preview-login", "/api/preview-login"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const token = request.cookies.get(previewCookieName())?.value;
  if (await validPreviewToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Vorschau-Anmeldung erforderlich." }, { status: 401 });
  }

  const loginUrl = new URL("/preview-login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:css|js|png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2)$).*)"],
};
