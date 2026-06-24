import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "kfiq_onboarding_session";

// Cheap first-pass guard: if there's no session cookie at all, bounce to the
// login screen before the protected route even renders. Full JWT verification
// and the onboarding-completion gate still run in the page/API layer.
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  if (!hasSession) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
