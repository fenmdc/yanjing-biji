"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

export function ObsidianExportButton() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setExporting(true);
    setError("");

    const response = await fetch("/api/obsidian/export");
    setExporting(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError("导出失败，请稍后再试。");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yanjing-biji-obsidian-export.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download size={17} />
        {exporting ? "导出中..." : "导出 Markdown"}
      </button>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
