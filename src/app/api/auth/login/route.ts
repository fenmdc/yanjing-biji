import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim().toLocaleLowerCase() : "";

  if (!normalizedEmail || typeof password !== "string") {
    return NextResponse.json({ error: "请输入邮箱和密码。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "邮箱或密码不正确。" }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
