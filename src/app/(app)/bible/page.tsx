import Link from "next/link";
import { Bookmark, NotebookPen } from "lucide-react";
import { Button, PageHeader, Panel, Tag } from "@/components/ui";
import { bibleBooks, john3 } from "@/lib/sample-data";

export default function BiblePage() {
  return (
    <div>
      <PageHeader
        title="圣经阅读"
        description="选择经文，阅读上下文，并把一段经文送入研读工作区。"
        action={
          <Link href="/study/john-3-16">
            <Button>
              <NotebookPen size={17} />
              进入研读
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr_280px]">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">经卷目录</h2>
          <div className="space-y-1">
            {bibleBooks.map((book) => (
                <button
                  key={book.name}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    book.name === "约翰福音"
                    ? "bg-[var(--foreground)] font-semibold text-white"
                    : "text-[var(--muted)] hover:bg-[var(--panel-soft)]"
                }`}
              >
                <span>{book.name}</span>
                <span>{book.chapters}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-5 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">约翰福音 第 3 章</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">当前译本：中文和合本示例文本</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((chapter) => (
                <button
                  key={chapter}
                  className={`size-9 rounded-md text-sm font-semibold ${
                    chapter === 3
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-white text-[var(--muted)]"
                  }`}
                >
                  {chapter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {john3.map((item) => (
              <p
                key={item.verse}
                className={`rounded-md border-l-4 p-3 text-base leading-8 ${
                  item.verse >= 16 && item.verse <= 21
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-transparent hover:bg-[var(--panel-soft)]"
                }`}
              >
                <sup className="mr-2 text-sm font-semibold text-[var(--accent)]">
                  {item.verse}
                </sup>
                {item.text}
              </p>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">当前选择</h2>
          <div className="rounded-md border border-[var(--line)] bg-[var(--background)] p-3">
            <p className="font-semibold">约翰福音 3:16-21</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              适合建立一篇经文研读笔记，围绕救恩、信心、永生与光的主题观察。
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Tag>救恩</Tag>
            <Tag>信心</Tag>
            <Tag>永生</Tag>
          </div>
          <div className="mt-5 grid gap-3">
            <Button variant="secondary">
              <Bookmark size={16} />
              收藏经文
            </Button>
            <Link href="/study/john-3-16">
              <Button>
                <NotebookPen size={16} />
                新建研读
              </Button>
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
