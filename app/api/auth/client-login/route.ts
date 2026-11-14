import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isRateLimited, recordFailedAttempt, resetLoginAttempts } from "@/lib/rateLimit";

const schema = z.object({
  clientCode: z.string().regex(/^\d{5}$/),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const validation = schema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { clientCode, password } = validation.data;
  const client = await db.client.findUnique({ where: { clientCode } });

  if (client && client.status === "ACTIVE" && (await bcrypt.compare(password, client.passwordHash))) {
    await resetLoginAttempts(ip);
    await createSession("CLIENT", client.id, client.clientName);
    return NextResponse.json({ success: true });
  }

  // Only failed attempts count towards the limit.
  const locked = await recordFailedAttempt(ip);
  if (locked) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  return NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 });
}
