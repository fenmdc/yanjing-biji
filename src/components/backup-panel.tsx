"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react";

type RestoreResult = {
  created: Record<string, number>;
  skipped: Record<string, number>;
};

const labels: Record<string, string> = {
  tags: "标签",
  studies: "研读项目",
  notes: "笔记",
  documents: "资料",
  studyDocuments: "研读资料",
  noteLinks: "双链",
};

export function BackupPanel() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RestoreResult | null>(null);

  async function handleExport() {
    setExporting(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/backup");
    setExporting(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError("备份导出失败，请稍后再试。");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fallbackName = `yanjing-biji-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    link.href = url;
    link.download = filenameFromHeader(response.headers.get("content-disposition")) ?? fallbackName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.match(/\.zip$/i)) {
      setError("请选择研经笔记备份 zip 文件。");
      return;
    }

    setRestoring(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("backup", file);

    const response = await fetch("/api/backup", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    setRestoring(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !payload.result) {
      setError(typeof payload.error === "string" ? payload.error : "恢复失败，请检查备份文件。");
      return;
    }

    setResult(payload.result);
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-md border border-[var(--line)] bg-[var(--background)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--accent)] text-white">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h3 className="font-semibold">完整账户备份</h3>
            <p className="text-sm text-[var(--muted)]">导出为可恢复的 zip 文件。</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || restoring}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={17} />
          {exporting ? "备份中..." : "下载备份"}
        </button>
      </div>

      <div className="rounded-md border border-[var(--line)] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--foreground)] text-white">
            <RotateCcw size={20} />
          </span>
          <div>
            <h3 className="font-semibold">从备份恢复</h3>
            <p className="text-sm text-[var(--muted)]">非破坏式合并，已有内容会跳过。</p>
          </div>
        </div>

        <label className="mt-5 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]">
          <Upload size={17} />
          {restoring ? "恢复中..." : "选择备份 zip"}
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={handleRestore}
            disabled={exporting || restoring}
            className="sr-only"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 lg:col-span-2">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-md bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)] lg:col-span-2">
          <p className="font-semibold">恢复完成</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {Object.entries(labels).map(([key, label]) => (
              <div key={key} className="rounded-md bg-white/70 p-3">
                <p className="font-semibold">{label}</p>
                <p className="mt-1 text-xs">
                  新增 {result.created[key] ?? 0}，跳过 {result.skipped[key] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function filenameFromHeader(header: string | null) {
  if (!header) return null;
  const match = header.match(/filename="?([^"]+)"?/i);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
