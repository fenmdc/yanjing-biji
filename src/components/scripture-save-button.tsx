"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import {
  addStudySourceSnippet,
  type StudySourceSnippet,
} from "@/lib/study-storage";

export function ScriptureSaveButton({ snippet }: { snippet: StudySourceSnippet }) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    addStudySourceSnippet(snippet);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
    >
      {saved ? <Check size={15} /> : <Plus size={15} />}
      {saved ? "已加入" : "加入研读"}
    </button>
  );
}
