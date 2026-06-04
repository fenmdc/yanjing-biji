import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  DOCUMENT_WITH_TAGS,
  documentToClient,
  normalizeDocumentType,
} from "@/lib/documents";
import { createExcerpt, parseTags, tagSlug } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    ...DOCUMENT_WITH_TAGS,
  });

  return NextResponse.json({ documents: documents.map(documentToClient) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : "未命名资料";
  const fileType = normalizeDocumentType(payload.fileType);
  const extractedText = typeof payload.extractedText === "string" ? payload.extractedText : "";
  const originalFilename =
    typeof payload.originalFilename === "string" && payload.originalFilename.trim()
      ? payload.originalFilename.trim()
      : `${title}.${fileType === "Markdown" ? "md" : "txt"}`;
  const tags = parseTags(typeof payload.tags === "string" ? payload.tags : "");

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "请填写资料正文或摘录内容。" }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      userId: user.id,
      title,
      originalFilename,
      fileType,
      extractedText,
      excerpt: createExcerpt(extractedText),
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
    ...DOCUMENT_WITH_TAGS,
  });

  return NextResponse.json({ document: documentToClient(document) }, { status: 201 });
}
