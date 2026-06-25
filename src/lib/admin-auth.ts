import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Admin sessions are deliberately separate from the intern session
// (src/lib/auth.ts): different cookie, different payload shape. This keeps the
// working intern auth path untouched.
const COOKIE_NAME = "kfiq_admin_session";
const SESSION_TTL = "7d";

export type AdminSessionPayload = {
  adminUserId: string;
  email: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(payload: AdminSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const adminUserId = payload.adminUserId;
    const email = payload.email;

    if (typeof adminUserId !== "string" || typeof email !== "string") {
      return null;
    }

    return { adminUserId, email };
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(payload: AdminSessionPayload) {
  const token = await createAdminSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSessionFromCookies(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function getAdminSessionFromRequest(
  request: NextRequest
): Promise<AdminSessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

/**
 * Guard for admin API routes. Returns the session on success, or a 401 Response
 * to return directly. Usage:
 *   const session = await requireAdmin();
 *   if (session instanceof Response) return session;
 */
export async function requireAdmin(): Promise<AdminSessionPayload | Response> {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/** The email domain admins must belong to. Configurable; defaults to kfiq.com. */
export function getAdminEmailDomain() {
  return (process.env.ADMIN_EMAIL_DOMAIN ?? "kfiq.com").toLowerCase();
}

/** True if the email belongs to the configured KFIQ admin domain. */
export function isKfiqDomainEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${getAdminEmailDomain()}`);
}
