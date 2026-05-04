import { studyMarkdown } from "@/lib/sample-data";

export const STUDY_STORAGE_KEY = "yanjing-biji:john-3-16-study";

export function getStoredStudyMarkdown() {
  if (typeof window === "undefined") return studyMarkdown;
  return window.localStorage.getItem(STUDY_STORAGE_KEY) ?? studyMarkdown;
}

export function saveStudyMarkdown(markdown: string) {
  window.localStorage.setItem(STUDY_STORAGE_KEY, markdown);
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
