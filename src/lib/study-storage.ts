import { studyMarkdown } from "@/lib/sample-data";
import { getStudyNoteId, saveLocalNote } from "@/lib/local-notes";

export const STUDY_STORAGE_KEY = "yanjing-biji:john-3-16-study";
export const STUDY_SNIPPETS_KEY = "yanjing-biji:study-source-snippets";

export type StudySourceSnippet = {
  id: string;
  reference: string;
  text: string;
  versionCode: string;
  versionShortName: string;
  href: string;
};

export function getStoredStudyMarkdown() {
  if (typeof window === "undefined") return studyMarkdown;
  const notesRaw = window.localStorage.getItem("yanjing-biji:local-notes");
  if (notesRaw) {
    try {
      const notes = JSON.parse(notesRaw);
      const studyNote = Array.isArray(notes)
        ? notes.find((note) => note?.id === getStudyNoteId())
        : undefined;
      if (typeof studyNote?.body === "string") return studyNote.body;
    } catch {
      return window.localStorage.getItem(STUDY_STORAGE_KEY) ?? studyMarkdown;
    }
  }

  return window.localStorage.getItem(STUDY_STORAGE_KEY) ?? studyMarkdown;
}

export function saveStudyMarkdown(markdown: string) {
  window.localStorage.setItem(STUDY_STORAGE_KEY, markdown);
  saveLocalNote({
    id: getStudyNoteId(),
    title: "约翰福音 3:16-21 研读",
    type: "经文笔记",
    tags: ["救恩", "信心", "永生"],
    excerpt: "约翰福音 3:16-21 研读笔记。",
    body: markdown,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function getStudySourceSnippets() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STUDY_SNIPPETS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStudySourceSnippet);
  } catch {
    return [];
  }
}

export function addStudySourceSnippet(snippet: StudySourceSnippet) {
  const snippets = getStudySourceSnippets();
  const next = [
    snippet,
    ...snippets.filter((item) => item.id !== snippet.id),
  ].slice(0, 12);

  window.localStorage.setItem(STUDY_SNIPPETS_KEY, JSON.stringify(next));
}

export function removeStudySourceSnippet(id: string) {
  const snippets = getStudySourceSnippets().filter((item) => item.id !== id);
  window.localStorage.setItem(STUDY_SNIPPETS_KEY, JSON.stringify(snippets));
}

function isStudySourceSnippet(value: unknown): value is StudySourceSnippet {
  if (!value || typeof value !== "object") return false;

  const snippet = value as Record<string, unknown>;
  return (
    typeof snippet.id === "string" &&
    typeof snippet.reference === "string" &&
    typeof snippet.text === "string" &&
    typeof snippet.versionCode === "string" &&
    typeof snippet.versionShortName === "string" &&
    typeof snippet.href === "string"
  );
}

export function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
