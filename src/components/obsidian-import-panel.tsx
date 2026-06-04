"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";

type ImportResult = {
  id: string;
  title: string;
  kind: "note" | "document";
  href: string;
};

export function ObsidianImportPanel() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setError("");
    setResult(null);

    if (!file.name.match(/\.md$|\.markdown$/i)) {
      setImporting(false);
      setError("请选择 .md 或 .markdown 文件。");
      return;
    }

    const markdown = await file.text();
    const response = await fetch("/api/obsidian/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        markdown,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setImporting(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !payload.imported) {
      setError(typeof payload.error === "string" ? payload.error : "导入失败，请稍后再试。");
      return;
    }

    setResult(payload.imported);
    router.refresh();
  }

  return (
    <div>
      <label className="mt-5 flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--background)] text-center transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
        <FileUp size={28} className="mb-3 text-[var(--accent)]" />
        <span className="font-semibold">{importing ? "导入中..." : "选择 Markdown 文件"}</span>
        <span className="mt-1 text-sm text-[var(--muted)]">
          识别 YAML frontmatter、#标签 与正文标题
        </span>
        <input
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={handleFileChange}
          className="sr-only"
          disabled={importing}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-md bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]">
          <p className="font-semibold">
            已导入{result.kind === "note" ? "笔记" : "资料"}：{result.title}
          </p>
          <Link
            href={result.href}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-white"
          >
            <Upload size={15} />
            打开查看
          </Link>
        </div>
      ) : null}
    </div>
  );
}
