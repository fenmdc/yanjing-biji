import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createExcerpt, createSlug, tagSlug } from "@/lib/notes";
import { parseObsidianMarkdown } from "@/lib/obsidian-import";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const filename = typeof payload.filename === "string" ? payload.filename : "obsidian-import.md";
  const markdown = typeof payload.markdown === "string" ? payload.markdown : "";

  if (!filename.match(/\.md$|\.markdown$/i)) {
    return NextResponse.json({ error: "当前只支持导入 .md 或 .markdown 文件。" }, { status: 400 });
  }

  if (!markdown.trim()) {
    return NextResponse.json({ error: "Markdown 文件内容为空。" }, { status: 400 });
  }

  const parsed = parseObsidianMarkdown({ filename, markdown });

  if (parsed.target === "document") {
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        title: parsed.title,
        originalFilename: filename,
        fileType: parsed.documentType,
        extractedText: parsed.body,
        excerpt: createExcerpt(parsed.body),
        tags: createTagWrites(user.id, parsed.tags),
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json({
      imported: {
        id: document.id,
        title: document.title,
        kind: "document",
        href: `/library?doc=${document.id}`,
      },
    }, { status: 201 });
  }

  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title: parsed.title,
      slug: createSlug(parsed.title),
      type: parsed.noteType,
      markdownBody: markdown,
      excerpt: createExcerpt(markdown),
      source: "OBSIDIAN_IMPORT",
      obsidianPath: filename,
      tags: createTagWrites(user.id, parsed.tags),
    },
    select: {
      id: true,
      title: true,
    },
  });

  return NextResponse.json({
    imported: {
      id: note.id,
      title: note.title,
      kind: "note",
      href: `/notes/${note.id}`,
    },
  }, { status: 201 });
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
