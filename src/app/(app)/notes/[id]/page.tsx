"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { PageHeader, Panel, Tag } from "@/components/ui";
import {
  formatNoteDate,
  NOTE_TYPES,
  type LocalNote,
} from "@/lib/local-notes";
import { downloadMarkdown } from "@/lib/study-storage";

export default function NoteEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<LocalNote | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("经文笔记");
  const [tagsText, setTagsText] = useState("");
  const [body, setBody] = useState("");
  const [savedAt, setSavedAt] = useState("尚未保存");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const wordCount = useMemo(() => body.replace(/\s/g, "").length, [body]);
  const tags = useMemo(
    () =>
      tagsText
        .split(/[,，\s]+/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean),
    [tagsText],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadNote() {
      setLoading(true);
      const response = await fetch(`/api/notes/${params.id}`);
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 404) {
        if (!cancelled) {
          setNote(null);
          setLoading(false);
        }
        return;
      }

      const payload = await response.json();
      const loadedNote = payload.note as LocalNote | undefined;
      if (!loadedNote || cancelled) return;

      setNote(loadedNote);
      setTitle(loadedNote.title);
      setType(loadedNote.type);
      setTagsText(loadedNote.tags.join(" "));
      setBody(loadedNote.body);
      setSavedAt(formatNoteDate(loadedNote.updatedAt));
      setLoading(false);
    }

    loadNote().catch(() => {
      if (!cancelled) {
        setError("读取笔记失败，请稍后再试。");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  async function handleSave() {
    if (!note) return;

    setSaving(true);
    setError("");
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "未命名研经笔记",
        type,
        tags: tags.join(" "),
        body,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok || !payload.note) {
      setError(typeof payload.error === "string" ? payload.error : "保存失败，请稍后再试。");
      return;
    }

    const nextNote = payload.note as LocalNote;

    setNote(nextNote);
    setSavedAt(formatNoteDate(nextNote.updatedAt));
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="正在读取笔记" description="正在从你的账户数据库读取这篇笔记。" />
      </div>
    );
  }

  if (!note) {
    return (
      <div>
        <PageHeader
          title="没有找到这篇笔记"
          description="这篇笔记不在当前账户中，或已经被删除。"
          action={
            <Link
              href="/notes"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              <ArrowLeft size={17} />
              返回笔记库
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="编辑笔记"
        description={`账户数据库 · ${wordCount} 字 · 保存：${savedAt}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/notes")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
            >
              <ArrowLeft size={17} />
              返回
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
            >
              <Save size={17} />
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={() => downloadMarkdown(`${title || "研经笔记"}.md`, body)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              <Download size={17} />
              导出
            </button>
          </div>
        }
      />

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <Panel className="p-4">
          <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">
            标题
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mb-4 h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />

          <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">
            类型
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mb-4 h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            {NOTE_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">
            标签
          </label>
          <input
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            className="mb-4 h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)]"
            placeholder="救恩 信心 永生"
          />

          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Tag>未分类</Tag>}
          </div>

          <div className="mt-5 rounded-md bg-[var(--background)] p-3 text-xs leading-5 text-[var(--muted)]">
            支持 Markdown、YAML、#标签 与 [[双链]]。保存后会回到笔记库列表中。
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--line)] bg-[var(--foreground)] px-4 py-3 text-white">
            <h2 className="font-semibold">Markdown 笔记正文</h2>
            <p className="mt-1 text-xs text-zinc-300">
              适合日常查经、灵修记录、讲章草稿和资料摘录。
            </p>
          </div>
          <MarkdownEditor value={body} onChange={setBody} />
        </Panel>
      </div>
    </div>
  );
}
