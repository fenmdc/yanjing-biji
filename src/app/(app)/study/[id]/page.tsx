"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Button, PageHeader, Panel, Tag } from "@/components/ui";
import { john3, resources, studyMarkdown } from "@/lib/sample-data";
import {
  downloadMarkdown,
  getStoredStudyMarkdown,
  saveStudyMarkdown,
} from "@/lib/study-storage";

export default function StudyPage() {
  const [body, setBody] = useState(studyMarkdown);
  const [savedAt, setSavedAt] = useState("尚未保存");
  const wordCount = useMemo(() => body.replace(/\s/g, "").length, [body]);

  useEffect(() => {
    queueMicrotask(() => {
      setBody(getStoredStudyMarkdown());
      const lastSaved = window.localStorage.getItem("yanjing-biji:john-3-16-saved-at");
      if (lastSaved) setSavedAt(lastSaved);
    });
  }, []);

  function handleSave() {
    const savedTime = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());

    saveStudyMarkdown(body);
    window.localStorage.setItem("yanjing-biji:john-3-16-saved-at", savedTime);
    setSavedAt(savedTime);
  }

  return (
    <div>
      <PageHeader
        title="约翰福音 3:16-21 研读"
        description="核心研读页：左边看上下文，中间写 Markdown，右边整理主题、双链与资料。"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
            >
              <Save size={17} />
              保存
            </button>
            <button
              onClick={() => downloadMarkdown("约翰福音 3.16-21 研读.md", body)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
            >
              <Download size={17} />
              导出
            </button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[260px_1fr_300px]">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">经文上下文</h2>
          <div className="space-y-2">
            {john3.map((item) => (
              <p
                key={item.verse}
                className={`rounded-md border-l-4 p-2 text-sm leading-6 ${
                  item.verse >= 16 && item.verse <= 21
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "border-transparent text-[var(--muted)]"
                }`}
              >
                <span className="mr-1 font-semibold">{item.verse}</span>
                {item.text}
              </p>
            ))}
          </div>

          <h2 className="mb-3 mt-5 text-sm font-semibold text-[var(--muted)]">关键词</h2>
          <div className="flex flex-wrap gap-2">
            {["神爱", "世人", "信", "永生", "光", "定罪"].map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--foreground)] px-4 py-3 text-white">
            <div>
              <h2 className="font-semibold">Markdown 研读笔记</h2>
              <p className="mt-1 text-xs text-zinc-300">
                支持 YAML、#标签 与 [[双链]]，方便进入 Obsidian。
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-300">
              {wordCount} 字 · 保存：{savedAt}
            </span>
          </div>
          <MarkdownEditor value={body} onChange={setBody} />
        </Panel>

        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">主题标签</h2>
          <div className="flex flex-wrap gap-2">
            {["救恩", "信心", "永生", "重生", "约翰福音"].map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-[var(--muted)]">双链笔记</h2>
          <div className="space-y-2">
            {["[[重生]]", "[[信心]]", "[[永生]]", "[[恩典]]"].map((link) => (
              <div
                key={link}
                className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                {link}
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-[var(--muted)]">相关资料</h2>
          <div className="space-y-3">
            {resources.slice(0, 2).map((resource) => (
              <div key={resource.title} className="rounded-md bg-[var(--background)] p-3">
                <p className="text-sm font-semibold">{resource.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{resource.passage}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
