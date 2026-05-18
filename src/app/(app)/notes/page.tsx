"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, FileText, Search } from "lucide-react";
import { PageHeader, Panel, Tag } from "@/components/ui";
import {
  formatNoteDate,
  type LocalNote,
} from "@/lib/local-notes";

const noteTypes = ["全部", "经文笔记", "主题笔记", "问题笔记", "讲章草稿"];

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [selectedType, setSelectedType] = useState("全部");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      const response = await fetch("/api/notes");
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const payload = await response.json();
      if (!cancelled) {
        setNotes(Array.isArray(payload.notes) ? payload.notes : []);
        setLoading(false);
      }
    }

    loadNotes().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return notes.filter((note) => {
      const typeMatched = selectedType === "全部" || note.type === selectedType;
      const queryMatched =
        !normalizedQuery ||
        [note.title, note.excerpt, note.body, ...note.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);

      return typeMatched && queryMatched;
    });
  }, [notes, query, selectedType]);

  async function handleCreateNote() {
    setCreating(true);
    const response = await fetch("/api/notes", { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setCreating(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (payload.note?.id) router.push(`/notes/${payload.note.id}`);
  }

  return (
    <div>
      <PageHeader
        title="笔记库"
        description="统一管理经文笔记、主题笔记、问题笔记与讲章草稿，已保存到你的账户数据库。"
        action={
          <button
            type="button"
            onClick={handleCreateNote}
            disabled={creating}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
          >
            <Edit3 size={17} />
            {creating ? "创建中..." : "新建笔记"}
          </button>
        }
      />

      <Panel className="mb-5 p-3">
        <div className="flex h-11 items-center gap-3 rounded-md bg-[var(--background)] px-3">
          <Search size={18} className="text-[var(--accent)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full flex-1 bg-transparent text-sm outline-none"
            placeholder="搜索标题、正文、标签"
            aria-label="搜索笔记"
          />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">笔记类型</h2>
          {noteTypes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSelectedType(item)}
              className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedType === item
                  ? "bg-[var(--foreground)] font-semibold text-white"
                  : "text-[var(--muted)] hover:bg-[var(--panel-soft)]"
              }`}
            >
              {item}
            </button>
          ))}

          <div className="mt-5 rounded-md border border-dashed border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
            当前笔记按账户保存。换设备时只要连接同一个数据库和账户即可继续使用。
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <Panel className="p-6 text-sm leading-6 text-[var(--muted)] md:col-span-2">
              正在读取你的笔记...
            </Panel>
          ) : null}

          {!loading && filteredNotes.map((note) => (
            <Link href={`/notes/${note.id}`} key={note.id}>
              <Panel className="h-full p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                    <FileText size={15} className="text-[var(--accent)]" />
                    {note.type}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatNoteDate(note.updatedAt)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{note.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
                  {note.excerpt}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </Panel>
            </Link>
          ))}

          {!loading && filteredNotes.length === 0 ? (
            <Panel className="p-6 text-sm leading-6 text-[var(--muted)] md:col-span-2">
              没有找到匹配的笔记。可以换一个关键词，或新建一篇笔记。
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
