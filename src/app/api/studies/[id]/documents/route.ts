import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createExcerpt } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

const DOCUMENT_SELECT = {
  id: true,
  title: true,
  originalFilename: true,
  fileType: true,
  excerpt: true,
  extractedText: true,
  updatedAt: true,
  tags: {
    include: {
      tag: true,
    },
  },
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.studyProject.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!project) return NextResponse.json({ error: "没有找到这个研读项目。" }, { status: 404 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  const linked = await prisma.studyDocument.findMany({
    where: { studyProjectId: project.id },
    orderBy: { createdAt: "desc" },
    include: {
      document: {
        select: DOCUMENT_SELECT,
      },
    },
  });

  const linkedIds = linked.map((item) => item.documentId);
  const candidates = await prisma.document.findMany({
    where: {
      userId: user.id,
      id: linkedIds.length > 0 ? { notIn: linkedIds } : undefined,
      ...(query ? { OR: documentSearchClauses(query) } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: DOCUMENT_SELECT,
  });

  return NextResponse.json({
    linkedDocuments: linked.map((item) => ({
      linkId: item.id,
      note: item.note,
      linkedAt: item.createdAt.toISOString(),
      document: documentToStudyClient(item.document),
    })),
    candidates: candidates.map(documentToStudyClient),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  const documentId = typeof payload.documentId === "string" ? payload.documentId : "";
  const note = typeof payload.note === "string" && payload.note.trim()
    ? payload.note.trim()
    : null;

  const [project, document] = await Promise.all([
    prisma.studyProject.findFirst({ where: { id, userId: user.id }, select: { id: true } }),
    prisma.document.findFirst({
      where: { id: documentId, userId: user.id },
      select: { id: true },
    }),
  ]);

  if (!project) return NextResponse.json({ error: "没有找到这个研读项目。" }, { status: 404 });
  if (!document) return NextResponse.json({ error: "没有找到这份资料。" }, { status: 404 });

  const link = await prisma.studyDocument.upsert({
    where: {
      studyProjectId_documentId: {
        studyProjectId: project.id,
        documentId: document.id,
      },
    },
    create: {
      studyProjectId: project.id,
      documentId: document.id,
      note,
    },
    update: { note },
    include: {
      document: {
        select: DOCUMENT_SELECT,
      },
    },
  });

  return NextResponse.json({
    linkedDocument: {
      linkId: link.id,
      note: link.note,
      linkedAt: link.createdAt.toISOString(),
      document: documentToStudyClient(link.document),
    },
  }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const documentId = url.searchParams.get("documentId") ?? "";

  const project = await prisma.studyProject.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!project) return NextResponse.json({ error: "没有找到这个研读项目。" }, { status: 404 });

  await prisma.studyDocument.deleteMany({
    where: {
      studyProjectId: project.id,
      documentId,
      document: { userId: user.id },
    },
  });

  return NextResponse.json({ ok: true });
}

function documentSearchClauses(query: string) {
  return [
    { title: { contains: query, mode: "insensitive" as const } },
    { originalFilename: { contains: query, mode: "insensitive" as const } },
    { excerpt: { contains: query, mode: "insensitive" as const } },
    { extractedText: { contains: query, mode: "insensitive" as const } },
    {
      tags: {
        some: {
          tag: {
            name: { contains: query, mode: "insensitive" as const },
          },
        },
      },
    },
  ];
}

function documentToStudyClient(document: {
  id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  excerpt: string | null;
  extractedText: string | null;
  updatedAt: Date;
  tags: Array<{ tag: { name: string } }>;
}) {
  const text = document.extractedText ?? "";

  return {
    id: document.id,
    title: document.title,
    originalFilename: document.originalFilename,
    fileType: document.fileType,
    excerpt: document.excerpt ?? createExcerpt(text),
    extractedText: text,
    tags: document.tags.map((item) => item.tag.name),
    updatedAt: document.updatedAt.toISOString(),
  };
}
