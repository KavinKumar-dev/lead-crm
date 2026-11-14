import { SignJWT } from "jose";
import { clearCookies, cookieStore, setCookie } from "./cookieStore";

const secret = process.env.SESSION_SECRET as string;

/**
 * Sign a session token exactly like lib/auth.ts does, so the tests exercise
 * the real JWT verification path.
 */
export async function signSession(
  role: "ADMIN" | "CLIENT",
  id: string,
  name?: string
): Promise<string> {
  return new SignJWT({ role, id, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(new TextEncoder().encode(secret));
}

/** Log the test client in (session cookie = the client's internal id). */
export async function loginAsClient(clientId: string, name = "Test Client") {
  setCookie("session", await signSession("CLIENT", clientId, name));
}

/** Log the test administrator in. */
export async function loginAsAdmin(userId: string, name = "Test Admin") {
  setCookie("session", await signSession("ADMIN", userId, name));
}

export function logout() {
  clearCookies();
}

/** The raw session cookie currently in the jar (if any). */
export function currentSessionCookie(): string | undefined {
  return cookieStore.current.session;
}
