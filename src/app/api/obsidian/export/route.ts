import JSZip from "jszip";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createMarkdownFile, noteTypeFolder, safeMarkdownFilename } from "@/lib/obsidian-export";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const [notes, studies, documents] = await Promise.all([
    prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        studyProject: true,
      },
    }),
    prisma.studyProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
  ]);

  const zip = new JSZip();
  const usedPaths = new Set<string>();

  for (const note of notes) {
    const tags = note.tags.map((item) => item.tag.name);
    const folder = note.studyProject ? "Studies" : noteTypeFolder(note.type);
    const filename = uniquePath(
      `${folder}/${safeMarkdownFilename(note.studyProject?.title ?? note.title)}`,
      usedPaths,
    );

    zip.file(
      filename,
      createMarkdownFile({
        title: note.studyProject?.title ?? note.title,
        type: note.type.toLocaleLowerCase(),
        tags,
        body: note.markdownBody,
      }),
    );
  }

  for (const study of studies) {
    const hasStudyNote = notes.some((note) => note.studyProjectId === study.id);
    if (hasStudyNote) continue;

    const filename = uniquePath(`Studies/${safeMarkdownFilename(study.title)}`, usedPaths);
    zip.file(
      filename,
      createMarkdownFile({
        title: study.title,
        type: "study",
        tags: ["研读"],
        body: study.summary ?? `${study.passageLabel}\n\n还没有研读笔记。`,
      }),
    );
  }

  for (const document of documents) {
    const tags = document.tags.map((item) => item.tag.name);
    const filename = uniquePath(`Resources/${safeMarkdownFilename(document.title)}`, usedPaths);
    zip.file(
      filename,
      createMarkdownFile({
        title: document.title,
        type: document.fileType,
        tags,
        body: document.extractedText ?? document.excerpt ?? "",
      }),
    );
  }

  zip.file(
    "README.md",
    `# 研经笔记导出

- 笔记：${notes.length}
- 研读项目：${studies.length}
- 资料：${documents.length}

导出时间：${new Date().toISOString()}
`,
  );

  const blob = await zip.generateAsync({ type: "blob" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent("yanjing-biji-obsidian-export.zip")}"`,
    },
  });
}

function uniquePath(path: string, usedPaths: Set<string>) {
  if (!usedPaths.has(path)) {
    usedPaths.add(path);
    return path;
  }

  const extensionIndex = path.lastIndexOf(".");
  const base = extensionIndex >= 0 ? path.slice(0, extensionIndex) : path;
  const extension = extensionIndex >= 0 ? path.slice(extensionIndex) : "";
  let index = 2;
  let nextPath = `${base}-${index}${extension}`;

  while (usedPaths.has(nextPath)) {
    index += 1;
    nextPath = `${base}-${index}${extension}`;
  }

  usedPaths.add(nextPath);
  return nextPath;
}
