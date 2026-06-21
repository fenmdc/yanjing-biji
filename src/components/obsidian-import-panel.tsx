"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileUp, Upload } from "lucide-react";

type ImportFile = {
  filename: string;
  markdown: string;
};

type ImportPreview = {
  index: number;
  filename: string;
  title: string;
  kind: "note" | "document";
  type: string;
  tags: string[];
  excerpt: string;
  duplicate: boolean;
  duplicateReason: string | null;
};

type ImportResult = {
  id: string;
  title: string;
  kind: "note" | "document";
  href: string;
};

type SkippedImport = {
  filename: string;
  title: string;
  reason: string;
};

export function ObsidianImportPanel() {
  const router = useRouter();
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [previews, setPreviews] = useState<ImportPreview[]>([]);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [skipped, setSkipped] = useState<SkippedImport[]>([]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    setError("");
    setResults([]);
    setSkipped([]);
    setPreviews([]);

    const invalid = selectedFiles.find((file) => !file.name.match(/\.md$|\.markdown$/i));
    if (invalid) {
      setError(`请选择 .md 或 .markdown 文件：${invalid.name}`);
      return;
    }

    const nextFiles = await Promise.all(
      selectedFiles.map(async (file) => ({
        filename: file.name,
        markdown: await file.text(),
      })),
    );

    setFiles(nextFiles);
    await previewFiles(nextFiles);
  }

  async function previewFiles(nextFiles: ImportFile[]) {
    setPreviewing(true);
    setError("");

    const response = await fetch("/api/obsidian/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "preview",
        files: nextFiles,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setPreviewing(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !Array.isArray(payload.previews)) {
      setError(typeof payload.error === "string" ? payload.error : "预览失败，请稍后再试。");
      return;
    }

    setPreviews(payload.previews);
  }

  async function handleImport() {
    setImporting(true);
    setError("");
    setResults([]);
    setSkipped([]);

    const response = await fetch("/api/obsidian/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "import",
        files,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setImporting(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !Array.isArray(payload.imported)) {
      setError(typeof payload.error === "string" ? payload.error : "导入失败，请稍后再试。");
      return;
    }

    setResults(payload.imported);
    setSkipped(Array.isArray(payload.skipped) ? payload.skipped : []);
    router.refresh();
  }

  const importableCount = previews.filter((preview) => !preview.duplicate).length;

  return (
    <div>
      <label className="mt-5 flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--background)] text-center transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
        <FileUp size={28} className="mb-3 text-[var(--accent)]" />
        <span className="font-semibold">
          {previewing ? "解析预览中..." : "选择 Markdown 文件"}
        </span>
        <span className="mt-1 text-sm text-[var(--muted)]">
          支持批量选择，导入前会检查重复项
        </span>
        <input
          type="file"
          multiple
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={handleFileChange}
          className="sr-only"
          disabled={previewing || importing}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {previews.length > 0 ? (
        <div className="mt-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              预览 {previews.length} 个文件，{importableCount} 个可导入
            </p>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || importableCount === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={17} />
              {importing ? "导入中..." : "确认导入"}
            </button>
          </div>

          <div className="grid gap-2">
            {previews.map((preview) => (
              <div
                key={`${preview.filename}-${preview.index}`}
                className={`rounded-md border p-3 text-sm ${
                  preview.duplicate
                    ? "border-amber-200 bg-amber-50"
                    : "border-[var(--line)] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{preview.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {preview.kind === "note" ? "笔记" : "资料"} · {preview.type} ·{" "}
                      {preview.filename}
                    </p>
                  </div>
                  {preview.duplicate ? (
                    <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                  ) : (
                    <CheckCircle2 size={18} className="shrink-0 text-[var(--accent)]" />
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                  {preview.excerpt}
                </p>
                {preview.tags.length > 0 ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    标签：{preview.tags.join("、")}
                  </p>
                ) : null}
                {preview.duplicateReason ? (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    将跳过：{preview.duplicateReason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {results.length > 0 || skipped.length > 0 ? (
        <div className="mt-4 rounded-md bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]">
          {results.length > 0 ? (
            <div>
              <p className="font-semibold">已导入 {results.length} 个文件</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {results.slice(0, 4).map((result) => (
                  <Link
                    key={result.id}
                    href={result.href}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-white"
                  >
                    打开{result.kind === "note" ? "笔记" : "资料"}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {skipped.length > 0 ? (
            <p className="mt-3 text-xs font-semibold">已跳过 {skipped.length} 个重复文件。</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
