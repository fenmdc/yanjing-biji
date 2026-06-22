"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Plus, Save } from "lucide-react";
import { DOCUMENT_TYPES } from "@/lib/document-types";

export function DocumentCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState<(typeof DOCUMENT_TYPES)[number]>("摘录");
  const [tags, setTags] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setNotice("");
    setFileName(file.name);
    setParsing(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/documents/parse", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setParsing(false);
    event.target.value = "";

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !payload.parsed) {
      setError(typeof payload.error === "string" ? payload.error : "解析失败，请手动粘贴资料正文。");
      return;
    }

    const parsed = payload.parsed as {
      title: string;
      fileType: (typeof DOCUMENT_TYPES)[number];
      originalFilename: string;
      extractedText: string;
      warning: string | null;
    };

    setTitle((current) => current || parsed.title || "未命名资料");
    setFileType(parsed.fileType);
    setFileName(parsed.originalFilename);
    setExtractedText(parsed.extractedText);
    setNotice(parsed.warning ?? `${parsed.fileType} 已解析，可继续补充标签后保存。`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        fileType,
        tags,
        extractedText,
        originalFilename: fileName,
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

    setTitle("");
    setTags("");
    setExtractedText("");
    setFileName("");
    setNotice("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
      >
        <Plus size={17} />
        新增资料
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-[var(--line)] bg-white p-4 shadow-[var(--shadow)]"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
          placeholder="资料标题"
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

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-dashed border-[var(--line)] bg-[var(--background)] px-3 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[var(--panel-soft)]">
        <FileUp size={17} className="text-[var(--accent)]" />
        <span className="font-semibold text-[var(--foreground)]">
          {parsing ? "解析文件中..." : "选择资料文件"}
        </span>
        <span className="min-w-0 truncate">
          {fileName || "支持 .txt / .md / .pdf / .docx，也可以直接粘贴正文"}
        </span>
        <input
          type="file"
          accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          disabled={parsing || saving}
          className="sr-only"
        />
      </label>

      <textarea
        value={extractedText}
        onChange={(event) => setExtractedText(event.target.value)}
        className="min-h-40 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[var(--accent)]"
        placeholder="粘贴资料正文、讲章摘录、书摘或 Markdown 内容"
        aria-label="资料正文"
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving || parsing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "保存中..." : "保存资料"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
            setNotice("");
          }}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
        >
          取消
        </button>
      </div>
    </form>
  );
}
