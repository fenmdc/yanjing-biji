import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBibleChapter } from "@/lib/bible-files";
import { createExcerpt, noteToClient, NOTE_WITH_TAGS, tagSlug } from "@/lib/notes";
import { prisma } from "@/lib/prisma";
import { studyMarkdown } from "@/lib/sample-data";
import { studyProjectToClient } from "@/lib/studies";

const STUDY_TAGS = ["救恩", "信心", "永生"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const project = await getStudyProject(user.id, id);

  if (!project) {
    const legacy = await getLegacyStudy(user.id, id);
    return NextResponse.json(legacy);
  }

  const primaryNote = await getPrimaryNote(user.id, project.id);
  const context = getStudyContext(project);

  return NextResponse.json({
    study: studyProjectToClient(project),
    note: primaryNote ? noteToClient(primaryNote) : null,
    markdown: primaryNote?.markdownBody ?? studyMarkdown,
    context,
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
  const project = await getStudyProject(user.id, id);

  if (!project) {
    const note = await saveLegacyStudy(user.id, id, markdown);
    return NextResponse.json({ note: noteToClient(note) });
  }

  const existingNote = await prisma.note.findFirst({
    where: { userId: user.id, studyProjectId: project.id },
    select: { id: true },
  });

  const note = existingNote
    ? await prisma.note.update({
        where: { id: existingNote.id },
        data: {
          title: project.title,
          markdownBody: markdown,
          excerpt: createExcerpt(markdown),
        },
        ...NOTE_WITH_TAGS,
      })
    : await prisma.note.create({
        data: {
          userId: user.id,
          studyProjectId: project.id,
          title: project.title,
          slug: `study-${project.id}`,
          type: "PASSAGE",
          markdownBody: markdown,
          excerpt: createExcerpt(markdown),
        },
        ...NOTE_WITH_TAGS,
      });

  const updatedProject = await prisma.studyProject.update({
    where: { id: project.id },
    data: { summary: createExcerpt(markdown) },
    include: {
      notes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, markdownBody: true, updatedAt: true },
      },
    },
  });

  return NextResponse.json({
    study: studyProjectToClient(updatedProject),
    note: noteToClient(note),
  });
}

async function getStudyProject(userId: string, id: string) {
  return prisma.studyProject.findFirst({
    where: { id, userId },
    include: {
      notes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, markdownBody: true, updatedAt: true },
      },
    },
  });
}

async function getPrimaryNote(userId: string, studyProjectId: string) {
  return prisma.note.findFirst({
    where: { userId, studyProjectId },
    orderBy: { updatedAt: "desc" },
    ...NOTE_WITH_TAGS,
  });
}

function getStudyContext(project: {
  versionCode: string | null;
  bookCode: string | null;
  chapter: number | null;
}) {
  if (!project.versionCode || !project.bookCode || !project.chapter) return null;

  const { bible, book, chapter } = getBibleChapter({
    versionCode: project.versionCode,
    bookCode: project.bookCode,
    chapter: project.chapter,
  });

  if (!bible || !book || !chapter) return null;

  return {
    versionShortName: bible.metadata.shortName,
    bookName: book.name,
    chapter: chapter.chapter,
    verses: chapter.verses,
  };
}

async function getLegacyStudy(userId: string, id: string) {
  const note = await prisma.note.findUnique({
    where: {
      userId_slug: {
        userId,
        slug: studySlug(id),
      },
    },
    ...NOTE_WITH_TAGS,
  });

  return {
    study: {
      id,
      title: studyTitle(id),
      passageLabel: id === "john-3-16" ? "约翰福音 3:16-21" : "研读笔记",
      status: "ACTIVE",
      summary: null,
      versionCode: "chinese_union_simp",
      bookCode: "John",
      chapter: 3,
      excerpt: note ? createExcerpt(note.markdownBody) : createExcerpt(studyMarkdown),
      noteId: note?.id ?? null,
      updatedAt: note?.updatedAt.toISOString() ?? new Date().toISOString(),
      noteUpdatedAt: note?.updatedAt.toISOString() ?? null,
    },
    note: note ? noteToClient(note) : null,
    markdown: note?.markdownBody ?? studyMarkdown,
    context: getStudyContext({
      versionCode: "chinese_union_simp",
      bookCode: "John",
      chapter: 3,
    }),
  };
}

async function saveLegacyStudy(userId: string, id: string, markdown: string) {
  return prisma.note.upsert({
    where: {
      userId_slug: {
        userId,
        slug: studySlug(id),
      },
    },
    create: {
      userId,
      title: studyTitle(id),
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
                  userId,
                  slug: tagSlug(tag),
                },
              },
              create: {
                userId,
                name: tag,
                slug: tagSlug(tag),
              },
            },
          },
        })),
      },
    },
    update: {
      title: studyTitle(id),
      markdownBody: markdown,
      excerpt: createExcerpt(markdown),
    },
    ...NOTE_WITH_TAGS,
  });
}

function studySlug(id: string) {
  return `study-${id}`;
}

function studyTitle(id: string) {
  if (id === "john-3-16") return "约翰福音 3:16-21 研读";
  return "研读笔记";
}
