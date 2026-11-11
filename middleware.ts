import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) throw new Error("SESSION_SECRET is not defined");
const encodedKey = new TextEncoder().encode(SESSION_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get("session")?.value;

  let session: any = null;
  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, encodedKey);
      session = payload;
    } catch (e) {
      session = null;
    }
  }

  // Public routes
  if (pathname === "/" || pathname === "/admin/login" || pathname === "/client/login") {
    return NextResponse.next();
  }

  // Protected Admin routes
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Protected Client routes
  if (pathname.startsWith("/client")) {
    if (!session || session.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/client/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
