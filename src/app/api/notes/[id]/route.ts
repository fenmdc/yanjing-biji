import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createExcerpt,
  noteToClient,
  NOTE_WITH_TAGS,
  normalizeNoteType,
  parseTags,
  tagSlug,
} from "@/lib/notes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId: user.id },
    ...NOTE_WITH_TAGS,
  });

  if (!note) return NextResponse.json({ error: "没有找到这篇笔记。" }, { status: 404 });

  return NextResponse.json({ note: noteToClient(note) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : "未命名研经笔记";
  const body = typeof payload.body === "string" ? payload.body : "";
  const tags = parseTags(typeof payload.tags === "string" ? payload.tags : "");
  const type = normalizeNoteType(typeof payload.type === "string" ? payload.type : null);

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) return NextResponse.json({ error: "没有找到这篇笔记。" }, { status: 404 });

  const note = await prisma.note.update({
    where: { id },
    data: {
      title,
      type,
      markdownBody: body,
      excerpt: createExcerpt(body),
      tags: {
        deleteMany: {},
        create: tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: {
                userId_slug: {
                  userId: user.id,
                  slug: tagSlug(tag),
                },
              },
              create: {
                userId: user.id,
                name: tag,
                slug: tagSlug(tag),
              },
            },
          },
        })),
      },
    },
    ...NOTE_WITH_TAGS,
  });

  return NextResponse.json({ note: noteToClient(note) });
}
