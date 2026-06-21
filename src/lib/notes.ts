import { Prisma, NoteType } from "@prisma/client";

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  PASSAGE: "经文笔记",
  TOPIC: "主题笔记",
  QUESTION: "问题笔记",
  SERMON: "讲章草稿",
};

export const NOTE_LABEL_TO_TYPE = Object.fromEntries(
  Object.entries(NOTE_TYPE_LABELS).map(([type, label]) => [label, type]),
) as Record<string, NoteType>;

export const DEFAULT_NOTE_BODY = `---
type: passage
tags:
  - 研读
---

# 未命名研经笔记

## 经文


## 观察

- 

## 解释


## 应用

- 
`;

export const NOTE_WITH_TAGS = Prisma.validator<Prisma.NoteDefaultArgs>()({
  include: {
    tags: {
      include: {
        tag: true,
      },
    },
  },
});

export type NoteWithTags = Prisma.NoteGetPayload<typeof NOTE_WITH_TAGS>;

export function noteToClient(note: NoteWithTags) {
  return {
    id: note.id,
    title: note.title,
    type: NOTE_TYPE_LABELS[note.type],
    tags: note.tags.map((item) => item.tag.name),
    excerpt: note.excerpt ?? createExcerpt(note.markdownBody),
    body: note.markdownBody,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function normalizeNoteType(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") return NoteType.PASSAGE;
  if (value in NOTE_LABEL_TO_TYPE) return NOTE_LABEL_TO_TYPE[value];
  if (value in NOTE_TYPE_LABELS) return value as NoteType;

  return NoteType.PASSAGE;
}

export function parseTags(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") return [];

  return Array.from(
    new Set(
      value
        .split(/[,，\s]+/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export function createExcerpt(markdown: string) {
  const plain = markdown
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^#+\s+/gm, "")
    .replace(/[\[\]#>*_`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain.slice(0, 120) || "暂无摘要。";
}

export function createSlug(title: string) {
  const normalized = title
    .trim()
    .toLocaleLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  const base = normalized || "note";
  return `${base}-${Date.now().toString(36)}`;
}

export function tagSlug(tag: string) {
  return (
    tag
      .trim()
      .toLocaleLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "tag"
  );
}
