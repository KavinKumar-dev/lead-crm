import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isRateLimited } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (isRateLimited(ip)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json();
  const validation = schema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { email, password } = validation.data;
  const user = await db.user.findUnique({ where: { email } });
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    await createSession("ADMIN", user.id, user.name);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
