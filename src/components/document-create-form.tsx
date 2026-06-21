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
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setFileName(file.name);

    const extension = file.name.split(".").pop()?.toLocaleLowerCase() ?? "";
    if (extension === "pdf" || file.type === "application/pdf") {
      setError("PDF 文件已识别，但当前版本还不能解析 PDF 正文；请先粘贴摘录，或上传 .txt / .md 文件。");
      event.target.value = "";
      return;
    }

    if (!["txt", "md", "markdown"].includes(extension) && file.type && !file.type.startsWith("text/")) {
      setError("当前支持解析 .txt、.md、.markdown 文件。其他格式请先复制正文到资料正文。");
      event.target.value = "";
      return;
    }

    const text = await file.text();
    const inferredType = extension === "md" || extension === "markdown" ? "Markdown" : "TXT";
    const titleFromFile = file.name.replace(/\.[^.]+$/, "").trim();

    setTitle((current) => current || titleFromFile || "未命名资料");
    setFileType(inferredType);
    setExtractedText(text);
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
        <span className="font-semibold text-[var(--foreground)]">选择 .txt / .md 文件</span>
        <span className="min-w-0 truncate">{fileName || "也可以直接粘贴正文"}</span>
        <input
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown,application/pdf,.pdf"
          onChange={handleFileChange}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
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
          }}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
        >
          取消
        </button>
      </div>
    </form>
  );
}
