import matter from "gray-matter";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import { normalizeDocumentType } from "@/lib/documents";
import { normalizeNoteType, parseTags } from "@/lib/notes";

export type ParsedObsidianMarkdown = {
  title: string;
  body: string;
  tags: string[];
  target: "note" | "document";
  noteType: ReturnType<typeof normalizeNoteType>;
  documentType: string;
};

export function parseObsidianMarkdown({
  filename,
  markdown,
}: {
  filename: string;
  markdown: string;
}): ParsedObsidianMarkdown {
  const parsed = matter(markdown);
  const data = parsed.data as Record<string, unknown>;
  const body = parsed.content.trim() ? parsed.content : markdown;
  const title = normalizeTitle(data.title, body, filename);
  const type = typeof data.type === "string" ? data.type.trim() : "";
  const tags = normalizeTags(data.tags, body);
  const target = isDocumentType(type) ? "document" : "note";

  return {
    title,
    body,
    tags,
    target,
    noteType: normalizeNoteType(type || null),
    documentType: normalizeDocumentType(DOCUMENT_TYPES.find((item) => item === type) ?? type),
  };
}

function normalizeTitle(dataTitle: unknown, body: string, filename: string) {
  if (typeof dataTitle === "string" && dataTitle.trim()) return dataTitle.trim();

  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  return filename.replace(/\.[^.]+$/, "").trim() || "Obsidian 导入";
}

function normalizeTags(dataTags: unknown, body: string) {
  const frontmatterTags = Array.isArray(dataTags)
    ? dataTags.filter((tag): tag is string => typeof tag === "string")
    : typeof dataTags === "string"
      ? parseTags(dataTags)
      : [];
  const inlineTags = Array.from(body.matchAll(/(?:^|\s)#([\p{Letter}\p{Number}_/-]+)/gu)).map(
    (match) => match[1],
  );

  return Array.from(new Set([...frontmatterTags, ...inlineTags])).slice(0, 20);
}

function isDocumentType(type: string) {
  return ["resource", "resources", "document", "资料", "摘录", "Markdown", "TXT"].includes(type);
}
