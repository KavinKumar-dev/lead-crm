import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) throw new Error("SESSION_SECRET is not defined");
const encodedKey = new TextEncoder().encode(SESSION_SECRET);

export interface SessionPayload {
  role: "ADMIN" | "CLIENT";
  id: string; // userId or clientId
  name?: string;
  iat: number;
  exp: number;
}

export async function createSession(role: "ADMIN" | "CLIENT", id: string, name?: string) {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const session = await new SignJWT({ role, id, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encodedKey);

  cookies().set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = cookies().get("session")?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, encodedKey);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");
  return session;
}

export async function requireClient() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") redirect("/client/login");
  return session; // session.id here is the clientId
}

export function deleteSession() {
  cookies().delete("session");
}
