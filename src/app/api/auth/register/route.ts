import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { name, email, password } = await request.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim().toLocaleLowerCase() : "";
  const displayName = typeof name === "string" ? name.trim() : "";

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return NextResponse.json({ error: "请输入有效的邮箱。" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "密码至少需要 8 个字符。" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: displayName || null,
        passwordHash: hashPassword(password),
      },
    });

    await createSession(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "这个邮箱已经注册，可以直接登录。" }, { status: 409 });
    }

    throw error;
  }
}
