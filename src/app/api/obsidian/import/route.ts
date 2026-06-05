import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createExcerpt, createSlug, tagSlug } from "@/lib/notes";
import { ParsedObsidianMarkdown, parseObsidianMarkdown } from "@/lib/obsidian-import";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const action = payload.action === "import" ? "import" : "preview";
  const files = normalizeFiles(payload);

  if (files.length === 0) {
    return NextResponse.json({ error: "请选择至少一个 .md 或 .markdown 文件。" }, { status: 400 });
  }

  const invalidFile = files.find((file) => !file.filename.match(/\.md$|\.markdown$/i));
  if (invalidFile) {
    return NextResponse.json(
      { error: `当前只支持导入 .md 或 .markdown 文件：${invalidFile.filename}` },
      { status: 400 },
    );
  }

  const emptyFile = files.find((file) => !file.markdown.trim());
  if (emptyFile) {
    return NextResponse.json({ error: `Markdown 文件内容为空：${emptyFile.filename}` }, { status: 400 });
  }

  const parsedFiles = files.map((file) => ({
    rawMarkdown: file.markdown,
    parsed: parseObsidianMarkdown(file),
  }));
  const duplicateMap = await findDuplicates(user.id, parsedFiles.map((file) => file.parsed));
  const previews = parsedFiles.map((file, index) => {
    const batchDuplicate = parsedFiles.findIndex(
      (item) =>
        item.parsed.title.toLocaleLowerCase() === file.parsed.title.toLocaleLowerCase() &&
        item.parsed.target === file.parsed.target,
    );
    const duplicates = duplicateMap.get(file.parsed.filename) ?? [];

    return {
      index,
      filename: file.parsed.filename,
      title: file.parsed.title,
      kind: file.parsed.target,
      type: file.parsed.target === "note" ? file.parsed.noteType : file.parsed.documentType,
      tags: file.parsed.tags,
      excerpt: createExcerpt(file.parsed.body),
      duplicate: duplicates.length > 0 || batchDuplicate !== index,
      duplicateReason:
        duplicates[0]?.reason ??
        (batchDuplicate !== index ? "同批次里已有相同标题和类型的文件" : null),
    };
  });

  if (action === "preview") return NextResponse.json({ previews });

  const imported = [];
  const skipped = [];

  for (const file of parsedFiles) {
    const preview = previews.find((item) => item.filename === file.parsed.filename);
    if (preview?.duplicate) {
      skipped.push({
        filename: file.parsed.filename,
        title: file.parsed.title,
        reason: preview.duplicateReason ?? "可能重复",
      });
      continue;
    }

    if (file.parsed.target === "document") {
      const document = await createDocument(user.id, file.parsed);
      imported.push({
        id: document.id,
        title: document.title,
        kind: "document",
        href: `/library?doc=${document.id}`,
      });
      continue;
    }

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: file.parsed.title,
        slug: createSlug(file.parsed.title),
        type: file.parsed.noteType,
        markdownBody: file.rawMarkdown,
        excerpt: createExcerpt(file.rawMarkdown),
        source: "OBSIDIAN_IMPORT",
        obsidianPath: file.parsed.filename,
        tags: createTagWrites(user.id, file.parsed.tags),
      },
      select: {
        id: true,
        title: true,
      },
    });

    imported.push({
      id: note.id,
      title: note.title,
      kind: "note",
      href: `/notes/${note.id}`,
    });
  }

  return NextResponse.json({ imported, skipped }, { status: 201 });
}

async function createDocument(userId: string, parsed: ParsedObsidianMarkdown) {
  return prisma.document.create({
    data: {
      userId,
      title: parsed.title,
      originalFilename: parsed.filename,
      fileType: parsed.documentType,
      extractedText: parsed.body,
      excerpt: createExcerpt(parsed.body),
      tags: createTagWrites(userId, parsed.tags),
    },
    select: {
      id: true,
      title: true,
    },
  });
}

async function findDuplicates(userId: string, files: ParsedObsidianMarkdown[]) {
  const noteTitles = files
    .filter((file) => file.target === "note")
    .map((file) => file.title);
  const documentTitles = files
    .filter((file) => file.target === "document")
    .map((file) => file.title);
  const notePaths = files
    .filter((file) => file.target === "note")
    .map((file) => file.filename);

  const [notes, documents] = await Promise.all([
    prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title: { in: noteTitles } },
          { obsidianPath: { in: notePaths } },
        ],
      },
      select: {
        title: true,
        obsidianPath: true,
      },
    }),
    prisma.document.findMany({
      where: {
        userId,
        title: { in: documentTitles },
      },
      select: {
        title: true,
      },
    }),
  ]);

  const duplicates = new Map<string, Array<{ reason: string }>>();

  for (const file of files) {
    const matches = [];
    if (
      file.target === "note" &&
      notes.some((note) => note.title === file.title || note.obsidianPath === file.filename)
    ) {
      matches.push({ reason: "已有相同标题或来源路径的笔记" });
    }
    if (file.target === "document" && documents.some((document) => document.title === file.title)) {
      matches.push({ reason: "资料库已有相同标题" });
    }
    if (matches.length > 0) duplicates.set(file.filename, matches);
  }

  return duplicates;
}

function normalizeFiles(payload: unknown) {
  const body = payload as Record<string, unknown>;
  const files = Array.isArray(body.files)
    ? body.files
    : [{ filename: body.filename, markdown: body.markdown }];

  return files
    .map((file) => {
      const item = file as Record<string, unknown>;
      return {
        filename: typeof item.filename === "string" ? item.filename : "obsidian-import.md",
        markdown: typeof item.markdown === "string" ? item.markdown : "",
      };
    })
    .slice(0, 50);
}

function createTagWrites(userId: string, tags: string[]) {
  return {
    create: tags.map((tag) => ({
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
  };
}
