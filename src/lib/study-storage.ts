import { studyMarkdown } from "@/lib/sample-data";

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
  return window.localStorage.getItem(STUDY_STORAGE_KEY) ?? studyMarkdown;
}

export function saveStudyMarkdown(markdown: string) {
  window.localStorage.setItem(STUDY_STORAGE_KEY, markdown);
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
