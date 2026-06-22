"use client";

import { useState } from "react";
import { KeyRound, Save, Trash2 } from "lucide-react";

type SearchKeyInfo = {
  provider: "brave" | "tavily";
  keyPreview: string;
  updatedAt: string;
};

const providerLabels: Record<SearchKeyInfo["provider"], string> = {
  brave: "Brave Search",
  tavily: "Tavily",
};

export function SearchApiKeySettings({ initialKeys }: { initialKeys: SearchKeyInfo[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [provider, setProvider] = useState<SearchKeyInfo["provider"]>("brave");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/settings/search-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok || !Array.isArray(payload.keys)) {
      setError(typeof payload.error === "string" ? payload.error : "保存 API key 失败。");
      return;
    }

    setKeys(payload.keys);
    setApiKey("");
    setNotice(`${providerLabels[provider]} API key 已保存。`);
  }

  async function handleDelete(nextProvider: SearchKeyInfo["provider"]) {
    setDeleting(nextProvider);
    setError("");
    setNotice("");

    const response = await fetch(
      `/api/settings/search-keys?${new URLSearchParams({ provider: nextProvider })}`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => ({}));
    setDeleting("");

    if (!response.ok || !Array.isArray(payload.keys)) {
      setError(typeof payload.error === "string" ? payload.error : "删除 API key 失败。");
      return;
    }

    setKeys(payload.keys);
    setNotice(`${providerLabels[nextProvider]} API key 已删除。`);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <form
        onSubmit={handleSave}
        className="rounded-md border border-[var(--line)] bg-white p-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--foreground)] text-white">
            <KeyRound size={19} />
          </span>
          <div>
            <h2 className="font-semibold">保存搜索 API Key</h2>
            <p className="text-sm text-[var(--muted)]">用于研读页全网资料索引。</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as SearchKeyInfo["provider"])}
            className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
          >
            <option value="brave">Brave Search</option>
            <option value="tavily">Tavily</option>
          </select>
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
            placeholder="粘贴 API key"
            type="password"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? "保存中..." : "保存 API Key"}
          </button>
        </div>
      </form>

      <div className="rounded-md border border-[var(--line)] bg-white p-4">
        <h2 className="font-semibold">已配置服务</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">完整 key 不会回显，只显示预览。</p>

        <div className="mt-4 space-y-3">
          {keys.length > 0 ? (
            keys.map((item) => (
              <div
                key={item.provider}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--background)] p-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{providerLabels[item.provider]}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {item.keyPreview} · 更新 {formatDate(item.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.provider)}
                  disabled={deleting === item.provider}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-[var(--line)] p-3 text-sm leading-6 text-[var(--muted)]">
              还没有保存 API key。保存后，研读页的全网资料索引会优先使用你的账户设置。
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 lg:col-span-2">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 lg:col-span-2">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
