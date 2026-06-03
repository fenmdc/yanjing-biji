import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBibleChapter } from "@/lib/bible-files";
import { createExcerpt, createSlug, tagSlug } from "@/lib/notes";
import { prisma } from "@/lib/prisma";
import { createStudyMarkdown, studyProjectToClient } from "@/lib/studies";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const studies = await prisma.studyProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      notes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          id: true,
          markdownBody: true,
          updatedAt: true,
        },
      },
    },
  });

  return NextResponse.json({ studies: studies.map(studyProjectToClient) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const versionCode =
    typeof payload.versionCode === "string" ? payload.versionCode : "chinese_union_simp";
  const bookCode = typeof payload.bookCode === "string" ? payload.bookCode : "John";
  const requestedChapter = Number(payload.chapter ?? 3);
  const selectedChapter = Number.isInteger(requestedChapter) && requestedChapter > 0
    ? requestedChapter
    : 3;

  const { bible, book, chapter } = getBibleChapter({
    versionCode,
    bookCode,
    chapter: selectedChapter,
  });

  if (!bible || !book || !chapter) {
    return NextResponse.json({ error: "没有找到这段经文。" }, { status: 404 });
  }

  const passageLabel = `${book.name} ${chapter.chapter}`;
  const title = `${passageLabel} 研读`;
  const tags = [book.name, "研读"];
  const markdown = createStudyMarkdown({
    title,
    passageLabel,
    versionShortName: bible.metadata.shortName,
    verses: chapter.verses,
  });

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.studyProject.create({
      data: {
        userId: user.id,
        title,
        passageLabel,
        versionCode: bible.metadata.code,
        bookCode: book.code,
        chapter: chapter.chapter,
      },
    });

    await tx.note.create({
      data: {
        userId: user.id,
        title,
        studyProjectId: createdProject.id,
        slug: createSlug(`${title}-${createdProject.id}`),
        type: "PASSAGE",
        markdownBody: markdown,
        excerpt: createExcerpt(markdown),
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
    });

    return tx.studyProject.findUniqueOrThrow({
      where: { id: createdProject.id },
      include: {
        notes: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            markdownBody: true,
            updatedAt: true,
          },
        },
      },
    });
  });

  return NextResponse.json({ study: studyProjectToClient(project) }, { status: 201 });
}
