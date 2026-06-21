import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createExcerpt,
  createSlug,
  DEFAULT_NOTE_BODY,
  noteToClient,
  NOTE_WITH_TAGS,
  tagSlug,
} from "@/lib/notes";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    ...NOTE_WITH_TAGS,
  });

  return NextResponse.json({ notes: notes.map(noteToClient) });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const title = "未命名研经笔记";
  const tags = ["研读"];
  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title,
      slug: createSlug(title),
      type: "PASSAGE",
      markdownBody: DEFAULT_NOTE_BODY,
      excerpt: createExcerpt(DEFAULT_NOTE_BODY),
      tags: {
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

  return NextResponse.json({ note: noteToClient(note) }, { status: 201 });
}
