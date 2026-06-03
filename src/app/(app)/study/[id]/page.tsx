"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { PageHeader, Panel, Tag } from "@/components/ui";
import { resources, studyMarkdown } from "@/lib/sample-data";
import {
  downloadMarkdown,
  getStudySourceSnippets,
  removeStudySourceSnippet,
  type StudySourceSnippet,
} from "@/lib/study-storage";

type StudyView = {
  id: string;
  title: string;
  passageLabel: string;
};

type StudyContext = {
  versionShortName: string;
  bookName: string;
  chapter: number;
  verses: Array<{ verse: number; text: string }>;
} | null;

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [body, setBody] = useState(studyMarkdown);
  const [study, setStudy] = useState<StudyView>({
    id: params.id,
    title: "研读笔记",
    passageLabel: "经文研读",
  });
  const [context, setContext] = useState<StudyContext>(null);
  const [savedAt, setSavedAt] = useState("尚未保存");
  const [snippets, setSnippets] = useState<StudySourceSnippet[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const wordCount = useMemo(() => body.replace(/\s/g, "").length, [body]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudy() {
      const response = await fetch(`/api/studies/${params.id}`);
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const payload = await response.json();
      if (!cancelled && typeof payload.markdown === "string") {
        if (payload.study) {
          setStudy({
            id: payload.study.id,
            title: payload.study.title,
            passageLabel: payload.study.passageLabel,
          });
        }
        setContext(payload.context ?? null);
        setBody(payload.markdown);
        if (payload.note?.updatedAt) {
          setSavedAt(new Date(payload.note.updatedAt).toLocaleTimeString("zh-CN"));
        }
      }
    }

    loadStudy().catch(() => {
      if (!cancelled) setError("读取研读笔记失败，当前显示初始模板。");
    });

    queueMicrotask(() => {
      setSnippets(getStudySourceSnippets());
    });

    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  async function handleSave() {
    const savedTime = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());

    setSaving(true);
    setError("");
    const response = await fetch(`/api/studies/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: body }),
    });
    setSaving(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError("保存失败，请稍后再试。");
      return;
    }

    setSavedAt(savedTime);
  }

  function handleInsertSnippet(snippet: StudySourceSnippet) {
    const markdownBlock = [
      "",
      `> ${snippet.reference}（${snippet.versionShortName}）`,
      `> ${snippet.text}`,
      "",
      "观察：",
      "- ",
    ].join("\n");

    setBody((current) => `${current.trimEnd()}\n${markdownBlock}`);
    removeStudySourceSnippet(snippet.id);
    setSnippets(getStudySourceSnippets());
  }

  return (
    <div>
      <PageHeader
        title={study.title}
        description={`${study.passageLabel} · 左边看上下文，中间写 Markdown，右边整理主题、双链与资料。`}
        action={
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]"
            >
              <Save size={17} />
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => downloadMarkdown(`${study.title}.md`, body)}
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

      <div className="grid gap-5 xl:grid-cols-[260px_1fr_300px]">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">经文上下文</h2>
          <div className="space-y-2">
            {context ? (
              context.verses.map((item) => (
                <p
                  key={item.verse}
                  className="rounded-md border-l-4 border-transparent p-2 text-sm leading-6 text-[var(--muted)] hover:bg-[var(--panel-soft)]"
                >
                  <span className="mr-1 font-semibold text-[var(--accent)]">{item.verse}</span>
                  {item.text}
                </p>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[var(--line)] p-3 text-sm leading-6 text-[var(--muted)]">
                这个研读项目还没有绑定经文章节。
              </div>
            )}
          </div>

          <h2 className="mb-3 mt-5 text-sm font-semibold text-[var(--muted)]">关键词</h2>
          <div className="flex flex-wrap gap-2">
            {[context?.bookName, "研读", context?.versionShortName, "观察", "应用"]
              .filter(Boolean)
              .map((tag) => (
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

          <h2 className="mb-3 mt-6 text-sm font-semibold text-[var(--muted)]">研读篮</h2>
          <div className="space-y-3">
            {snippets.length > 0 ? (
              snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="rounded-md border border-[var(--line)] bg-[var(--background)] p-3"
                >
                  <Link
                    href={snippet.href}
                    className="text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]"
                  >
                    {snippet.reference}
                  </Link>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
                    {snippet.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet(snippet)}
                    className="mt-3 h-8 rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent)]"
                  >
                    插入笔记
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
                在搜索页把经文加入研读后，会显示在这里。
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
