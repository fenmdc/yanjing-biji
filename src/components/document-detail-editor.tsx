"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Save, Trash2, X } from "lucide-react";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import type { DocumentClient } from "@/lib/documents";

export function DocumentDetailEditor({ document }: { document: DocumentClient }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [fileType, setFileType] = useState<(typeof DOCUMENT_TYPES)[number]>(
    normalizeType(document.fileType),
  );
  const [tags, setTags] = useState(document.tags.join(" "));
  const [extractedText, setExtractedText] = useState(document.extractedText);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const wordCount = useMemo(() => extractedText.replace(/\s/g, "").length, [extractedText]);

  async function handleSave() {
    setSaving(true);
    setError("");

    const response = await fetch(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        fileType,
        tags,
        extractedText,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !payload.document) {
      setError(typeof payload.error === "string" ? payload.error : "保存资料失败，请稍后再试。");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(`删除“${document.title}”？这个操作无法撤销。`);
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setDeleting(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !payload.ok) {
      setError(typeof payload.error === "string" ? payload.error : "删除资料失败，请稍后再试。");
      return;
    }

    router.push("/library");
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mb-5 flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
        >
          <Edit3 size={17} />
          编辑资料
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 size={17} />
          {deleting ? "删除中..." : "删除"}
        </button>
        {error ? (
          <div className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-5 grid gap-3 border-b border-[var(--line)] pb-5">
      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
          aria-label="资料标题"
        />
        <select
          value={fileType}
          onChange={(event) => setFileType(event.target.value as (typeof DOCUMENT_TYPES)[number])}
          className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
          aria-label="资料类型"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
        placeholder="标签，例如：约翰福音 救恩 永生"
        aria-label="资料标签"
      />

      <textarea
        value={extractedText}
        onChange={(event) => setExtractedText(event.target.value)}
        className="min-h-64 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--accent)]"
        aria-label="资料正文"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "保存中..." : "保存修改"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError("");
            setTitle(document.title);
            setFileType(normalizeType(document.fileType));
            setTags(document.tags.join(" "));
            setExtractedText(document.extractedText);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
        >
          <X size={17} />
          取消
        </button>
        <span className="text-xs text-[var(--muted)]">{wordCount} 字</span>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function normalizeType(value: string): (typeof DOCUMENT_TYPES)[number] {
  return DOCUMENT_TYPES.find((type) => type === value) ?? "摘录";
}
