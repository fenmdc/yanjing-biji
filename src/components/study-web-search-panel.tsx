"use client";

import { useState } from "react";
import { ExternalLink, Link2, Search, Save } from "lucide-react";

export type WebSearchResultItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
  publishedAt: string | null;
};

export function StudyWebSearchPanel({
  studyId,
  defaultQuery,
  onSaved,
}: {
  studyId: string;
  defaultQuery: string;
  onSaved?: () => void;
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [provider, setProvider] = useState("");
  const [results, setResults] = useState<WebSearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingUrl, setSavingUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("请输入搜索关键词。");
      return;
    }

    setSearching(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/web-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmedQuery, limit: 8 }),
    });
    const payload = await response.json().catch(() => ({}));
    setSearching(false);

    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "搜索失败，请稍后再试。");
      return;
    }

    setProvider(typeof payload.provider === "string" ? payload.provider : "");
    setResults(Array.isArray(payload.results) ? payload.results : []);
    if (Array.isArray(payload.results) && payload.results.length === 0) {
      setNotice("没有找到结果，可以换一个关键词。");
    }
  }

  async function handleSaveResult(result: WebSearchResultItem) {
    setSavingUrl(result.url);
    setError("");
    setNotice("");

    const documentResponse = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: result.title,
        fileType: "摘录",
        tags: `全网索引 ${result.source}`,
        originalFilename: `${safeFilename(result.source || "web")}.md`,
        extractedText: [
          `# ${result.title}`,
          "",
          `来源：${result.url}`,
          result.publishedAt ? `时间：${result.publishedAt}` : null,
          "",
          "## 摘要",
          "",
          result.snippet,
        ].filter(Boolean).join("\n"),
      }),
    });
    const documentPayload = await documentResponse.json().catch(() => ({}));

    if (!documentResponse.ok || !documentPayload.document?.id) {
      setSavingUrl("");
      setError(typeof documentPayload.error === "string" ? documentPayload.error : "保存搜索结果失败。");
      return;
    }

    const linkResponse = await fetch(`/api/studies/${studyId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: documentPayload.document.id,
        note: `来自全网搜索：${query.trim()}`,
      }),
    });
    const linkPayload = await linkResponse.json().catch(() => ({}));
    setSavingUrl("");

    if (!linkResponse.ok) {
      setError(typeof linkPayload.error === "string" ? linkPayload.error : "资料已保存，但关联研读失败。");
      onSaved?.();
      return;
    }

    setNotice("已保存为资料，并关联到当前研读。");
    onSaved?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">全网资料索引</h2>
        {provider ? (
          <span className="text-xs font-semibold uppercase text-[var(--muted)]">{provider}</span>
        ) : null}
      </div>

      <form onSubmit={handleSearch} className="space-y-2">
        <div className="flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--background)] px-2.5">
          <Search size={15} className="text-[var(--accent)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none"
            placeholder="搜索经文背景、释经资料或主题"
            aria-label="全网资料搜索"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search size={14} />
          {searching ? "搜索中..." : "搜索资料"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="space-y-3">
        {results.map((result) => (
          <div key={result.id} className="rounded-md border border-[var(--line)] bg-[var(--background)] p-3">
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-1.5 text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]"
            >
              <span>{result.title}</span>
              <ExternalLink size={13} className="mt-1 shrink-0" />
            </a>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{result.source}</p>
            <p className="mt-2 line-clamp-4 text-xs leading-5 text-[var(--muted)]">
              {result.snippet}
            </p>
            <button
              type="button"
              onClick={() => handleSaveResult(result)}
              disabled={savingUrl === result.url}
              className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingUrl === result.url ? <Save size={14} /> : <Link2 size={14} />}
              {savingUrl === result.url ? "保存中..." : "保存并关联"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function safeFilename(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || "web";
}
