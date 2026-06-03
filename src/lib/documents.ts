import { Prisma } from "@prisma/client";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import { createExcerpt } from "@/lib/notes";

export { DOCUMENT_TYPES };

export const DOCUMENT_WITH_TAGS = Prisma.validator<Prisma.DocumentDefaultArgs>()({
  include: {
    tags: {
      include: {
        tag: true,
      },
    },
  },
});

export type DocumentWithTags = Prisma.DocumentGetPayload<typeof DOCUMENT_WITH_TAGS>;

export function documentToClient(document: DocumentWithTags) {
  return {
    id: document.id,
    title: document.title,
    originalFilename: document.originalFilename,
    fileType: document.fileType,
    excerpt: document.excerpt ?? createExcerpt(document.extractedText ?? ""),
    extractedText: document.extractedText ?? "",
    tags: document.tags.map((item) => item.tag.name),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function normalizeDocumentType(value: unknown) {
  if (typeof value !== "string") return "摘录";
  const trimmed = value.trim();
  return DOCUMENT_TYPES.find((type) => type === trimmed) ?? "摘录";
}
