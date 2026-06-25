import { NextRequest, NextResponse } from "next/server";

const INTERN_COOKIE = "kfiq_onboarding_session";
const ADMIN_COOKIE = "kfiq_admin_session";

// Cheap first-pass guard: bounce to the right login screen when the relevant
// session cookie is missing, before the protected route even renders. Full JWT
// verification and gates still run in the page/API layer.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin area: guard everything under /admin except the login page itself.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    if (!request.cookies.get(ADMIN_COOKIE)?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Intern area: /dashboard and /onboarding require the intern session.
  if (!request.cookies.get(INTERN_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*"],
};
