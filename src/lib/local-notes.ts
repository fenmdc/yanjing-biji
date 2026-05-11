import { notes as sampleNotes, studyMarkdown } from "@/lib/sample-data";

export const NOTE_LIBRARY_KEY = "yanjing-biji:local-notes";

export type LocalNote = {
  id: string;
  title: string;
  type: string;
  tags: string[];
  excerpt: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export const NOTE_TYPES = ["经文笔记", "主题笔记", "问题笔记", "讲章草稿"] as const;

const STUDY_NOTE_ID = "study-john-3-16";

export function getLocalNotes() {
  if (typeof window === "undefined") return getSeedNotes();

  const stored = readStoredNotes();
  if (stored.length > 0) return stored;

  const seeded = getSeedNotes();
  writeStoredNotes(seeded);
  return seeded;
}

export function getLocalNote(id: string) {
  return getLocalNotes().find((note) => note.id === id);
}

export function saveLocalNote(note: LocalNote) {
  const notes = getLocalNotes();
  const nextNote = {
    ...note,
    excerpt: createExcerpt(note.body),
    updatedAt: new Date().toISOString(),
  };
  const nextNotes = [
    nextNote,
    ...notes.filter((item) => item.id !== note.id),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  writeStoredNotes(nextNotes);
  return nextNote;
}

export function createLocalNote() {
  const note: LocalNote = {
    id: createId(),
    title: "未命名研经笔记",
    type: "经文笔记",
    tags: ["研读"],
    excerpt: "新的研经笔记。",
    body: `---
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
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return saveLocalNote(note);
}

export function getStudyNoteId() {
  return STUDY_NOTE_ID;
}

export function formatNoteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readStoredNotes() {
  const raw = window.localStorage.getItem(NOTE_LIBRARY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalNote);
  } catch {
    return [];
  }
}

function writeStoredNotes(notes: LocalNote[]) {
  window.localStorage.setItem(NOTE_LIBRARY_KEY, JSON.stringify(notes));
}

function getSeedNotes() {
  const now = new Date().toISOString();
  const seedNotes = sampleNotes.map((note, index) => ({
    id: `sample-${index + 1}`,
    title: note.title,
    type: note.type,
    tags: note.tags,
    excerpt: note.excerpt,
    body: createSampleBody(note.title, note.type, note.tags, note.excerpt),
    createdAt: now,
    updatedAt: now,
  }));

  return [
    {
      id: STUDY_NOTE_ID,
      title: "约翰福音 3:16-21 研读",
      type: "经文笔记",
      tags: ["救恩", "信心", "永生"],
      excerpt: createExcerpt(studyMarkdown),
      body: studyMarkdown,
      createdAt: now,
      updatedAt: now,
    },
    ...seedNotes.filter((note) => note.title !== "约翰福音 3:16-21 研读"),
  ];
}

function createSampleBody(title: string, type: string, tags: string[], excerpt: string) {
  const yamlTags = tags.map((tag) => `  - ${tag}`).join("\n");

  return `---
type: ${type}
tags:
${yamlTags}
---

# ${title}

${excerpt}

## 观察

- 

## 进一步整理

`;
}

function createExcerpt(markdown: string) {
  const plain = markdown
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^#+\s+/gm, "")
    .replace(/[\[\]#>*_`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain.slice(0, 90) || "暂无摘要。";
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}`;
}

function isLocalNote(value: unknown): value is LocalNote {
  if (!value || typeof value !== "object") return false;

  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.type === "string" &&
    Array.isArray(note.tags) &&
    note.tags.every((tag) => typeof tag === "string") &&
    typeof note.excerpt === "string" &&
    typeof note.body === "string" &&
    typeof note.createdAt === "string" &&
    typeof note.updatedAt === "string"
  );
}
