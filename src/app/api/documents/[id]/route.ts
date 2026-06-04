import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DOCUMENT_WITH_TAGS, documentToClient, normalizeDocumentType } from "@/lib/documents";
import { createExcerpt, parseTags, tagSlug } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    ...DOCUMENT_WITH_TAGS,
  });

  if (!document) return NextResponse.json({ error: "没有找到这份资料。" }, { status: 404 });

  return NextResponse.json({ document: documentToClient(document) });
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
      : "未命名资料";
  const fileType = normalizeDocumentType(payload.fileType);
  const extractedText = typeof payload.extractedText === "string" ? payload.extractedText : "";
  const tags = parseTags(typeof payload.tags === "string" ? payload.tags : "");

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "请填写资料正文或摘录内容。" }, { status: 400 });
  }

  const existing = await prisma.document.findFirst({
    where: { id, userId: user.id },
    select: { id: true, originalFilename: true },
  });

  if (!existing) return NextResponse.json({ error: "没有找到这份资料。" }, { status: 404 });

  const document = await prisma.document.update({
    where: { id },
    data: {
      title,
      fileType,
      originalFilename: existing.originalFilename || `${title}.${fileType === "Markdown" ? "md" : "txt"}`,
      extractedText,
      excerpt: createExcerpt(extractedText),
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
    ...DOCUMENT_WITH_TAGS,
  });

  return NextResponse.json({ document: documentToClient(document) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.document.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) return NextResponse.json({ error: "没有找到这份资料。" }, { status: 404 });

  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
