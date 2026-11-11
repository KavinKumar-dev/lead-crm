import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isRateLimited } from "@/lib/rateLimit";

const schema = z.object({
  clientCode: z.string().regex(/^\d{5}$/),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (isRateLimited(ip)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json();
  const validation = schema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { clientCode, password } = validation.data;
  const client = await db.client.findUnique({ where: { clientCode } });
  if (client && client.status === "ACTIVE" && (await bcrypt.compare(password, client.passwordHash))) {
    await createSession("CLIENT", client.id, client.clientName);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Invalid credentials or inactive account" }, { status: 401 });
}
