"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Download, ListPlus, Save } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { PageHeader, Panel, Tag } from "@/components/ui";
import {
  StudyDocumentsPanel,
  type StudyDocumentItem,
} from "@/components/study-documents-panel";
import { studyMarkdown } from "@/lib/sample-data";
import {
  ensureStudyWorkflowSections,
  insertStudyDocumentExcerpt,
  getStudyWorkflowStatus,
  insertStudySnippet,
} from "@/lib/study-workflow";
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
  const [documentLinksEnabled, setDocumentLinksEnabled] = useState(false);
  const [savedAt, setSavedAt] = useState("尚未保存");
  const [snippets, setSnippets] = useState<StudySourceSnippet[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const wordCount = useMemo(() => body.replace(/\s/g, "").length, [body]);
  const workflowStatus = useMemo(() => getStudyWorkflowStatus(body), [body]);
  const completedSections = workflowStatus.filter((section) => section.filled).length;
  const missingSections = workflowStatus.filter((section) => !section.exists);

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
        setDocumentLinksEnabled(Boolean(payload.documentLinksEnabled));
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
    setBody((current) => insertStudySnippet(current, snippet));
    removeStudySourceSnippet(snippet.id);
    setSnippets(getStudySourceSnippets());
  }

  function handleCompleteWorkflow() {
    setBody((current) => ensureStudyWorkflowSections(current));
  }

  function handleInsertDocumentExcerpt(document: StudyDocumentItem) {
    const excerpt = document.excerpt || document.extractedText.slice(0, 240).trim();
    if (!excerpt) {
      setError("这份资料还没有可摘录的正文。");
      return;
    }

    setBody((current) => insertStudyDocumentExcerpt(current, {
      title: document.title,
      fileType: document.fileType,
      excerpt,
    }));
    setError("");
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
                {completedSections}/{workflowStatus.length} 个区块已有内容
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-300">
              {wordCount} 字 · 保存：{savedAt}
            </span>
          </div>
          <MarkdownEditor value={body} onChange={setBody} />
        </Panel>

        <Panel className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--muted)]">研读流程</h2>
            <button
              type="button"
              onClick={handleCompleteWorkflow}
              disabled={missingSections.length === 0}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ListPlus size={14} />
              补齐
            </button>
          </div>
          <div className="space-y-2">
            {workflowStatus.map((section) => (
              <div
                key={section.heading}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] px-3 py-2 text-sm"
              >
                <span className="font-semibold">{section.heading}</span>
                <span
                  className={
                    section.filled
                      ? "inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                      : section.exists
                        ? "text-xs font-semibold text-[var(--muted)]"
                        : "text-xs font-semibold text-amber-700"
                  }
                >
                  {section.filled ? <CheckCircle2 size={14} /> : null}
                  {section.filled ? "已写" : section.exists ? "待写" : "缺少"}
                </span>
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-[var(--muted)]">主题标签</h2>
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

          <div className="mt-6">
            {documentLinksEnabled ? (
              <StudyDocumentsPanel
                studyId={study.id}
                onInsertExcerpt={handleInsertDocumentExcerpt}
              />
            ) : (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">关联资料</h2>
                <div className="rounded-md border border-dashed border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
                  从圣经页新建研读项目后，可以把资料库内容关联到当前研读。
                </div>
              </div>
            )}
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
