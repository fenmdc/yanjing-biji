"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { PageHeader, Panel, Tag } from "@/components/ui";
import {
  formatNoteDate,
  getLocalNote,
  NOTE_TYPES,
  saveLocalNote,
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
    queueMicrotask(() => {
      const loadedNote = getLocalNote(params.id);
      if (!loadedNote) return;

      setNote(loadedNote);
      setTitle(loadedNote.title);
      setType(loadedNote.type);
      setTagsText(loadedNote.tags.join(" "));
      setBody(loadedNote.body);
      setSavedAt(formatNoteDate(loadedNote.updatedAt));
    });
  }, [params.id]);

  function handleSave() {
    if (!note) return;

    const nextNote = saveLocalNote({
      ...note,
      title: title.trim() || "未命名研经笔记",
      type,
      tags,
      body,
    });

    setNote(nextNote);
    setSavedAt(formatNoteDate(nextNote.updatedAt));
  }

  if (!note) {
    return (
      <div>
        <PageHeader
          title="没有找到这篇笔记"
          description="这可能是浏览器本地数据被清理，或链接来自另一个设备。"
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
        description={`本地保存 · ${wordCount} 字 · 保存：${savedAt}`}
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
            >
              <Save size={17} />
              保存
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
