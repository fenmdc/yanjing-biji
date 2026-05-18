import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createExcerpt, noteToClient, NOTE_WITH_TAGS, tagSlug } from "@/lib/notes";
import { prisma } from "@/lib/prisma";
import { studyMarkdown } from "@/lib/sample-data";

const STUDY_TAGS = ["救恩", "信心", "永生"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const slug = studySlug(id);
  const note = await prisma.note.findUnique({
    where: {
      userId_slug: {
        userId: user.id,
        slug,
      },
    },
    ...NOTE_WITH_TAGS,
  });

  return NextResponse.json({
    note: note ? noteToClient(note) : null,
    markdown: note?.markdownBody ?? studyMarkdown,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  const markdown = typeof payload.markdown === "string" ? payload.markdown : studyMarkdown;
  const title = studyTitle(id);

  const note = await prisma.note.upsert({
    where: {
      userId_slug: {
        userId: user.id,
        slug: studySlug(id),
      },
    },
    create: {
      userId: user.id,
      title,
      slug: studySlug(id),
      type: "PASSAGE",
      markdownBody: markdown,
      excerpt: createExcerpt(markdown),
      tags: {
        create: STUDY_TAGS.map((tag) => ({
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
    update: {
      title,
      markdownBody: markdown,
      excerpt: createExcerpt(markdown),
      tags: {
        deleteMany: {},
        create: STUDY_TAGS.map((tag) => ({
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

function studySlug(id: string) {
  return `study-${id}`;
}

function studyTitle(id: string) {
  if (id === "john-3-16") return "约翰福音 3:16-21 研读";
  return "研读笔记";
}
