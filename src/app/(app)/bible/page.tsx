import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button, PageHeader, Panel, Tag } from "@/components/ui";
import { StudyCreateButton } from "@/components/study-create-button";
import { getBibleChapter, getBibleManifest } from "@/lib/bible-files";

export default async function BiblePage({
  searchParams,
}: {
  searchParams?: Promise<{
    version?: string;
    book?: string;
    chapter?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedVersion = params?.version ?? "chinese_union_simp";
  const selectedBook = params?.book ?? "John";
  const selectedChapter = Number(params?.chapter ?? 3);
  const versions = getBibleManifest();
  const { bible, book, chapter } = getBibleChapter({
    versionCode: selectedVersion,
    bookCode: selectedBook,
    chapter: selectedChapter,
  });
  const books = bible?.books ?? [];
  const verses = chapter?.verses ?? [];
  const safeChapter = chapter?.chapter ?? selectedChapter;
  const selectedPassageLabel = `${book?.name ?? "约翰福音"} ${safeChapter}`;

  return (
    <div>
      <PageHeader
        title="圣经阅读"
        description="选择经文，阅读上下文，并把一段经文送入研读工作区。"
        action={
          <StudyCreateButton
            versionCode={selectedVersion}
            bookCode={selectedBook}
            chapter={safeChapter}
            label="用本章新建研读"
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr_280px]">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">经卷目录</h2>
          <div className="max-h-[720px] space-y-1 overflow-auto pr-1">
            {books.map((item) => (
              <Link
                key={item.code}
                href={`/bible?version=${selectedVersion}&book=${item.code}&chapter=1`}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                  item.code === selectedBook
                    ? "bg-[var(--foreground)] font-semibold text-white"
                    : "text-[var(--muted)] hover:bg-[var(--panel-soft)]"
                }`}
              >
                <span>{item.name}</span>
                <span>{item.chapters.length}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-5 flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {book?.name ?? "约翰福音"} 第 {safeChapter} 章
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                当前译本：{bible?.metadata.name ?? "未处理圣经数据"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {versions.map((version) => (
                <Link
                  key={version.code}
                  href={`/bible?version=${version.code}&book=${selectedBook}&chapter=${safeChapter}`}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    version.code === selectedVersion
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                      : "border-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {version.shortName}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {book?.chapters.map((item) => (
                <Link
                  key={item.chapter}
                  href={`/bible?version=${selectedVersion}&book=${selectedBook}&chapter=${item.chapter}`}
                  className={`size-9 rounded-md text-sm font-semibold ${
                    item.chapter === safeChapter
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--line)] bg-white text-[var(--muted)]"
                  } inline-flex items-center justify-center`}
                >
                  {item.chapter}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {verses.map((item) => (
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
            <p className="font-semibold">{selectedPassageLabel}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              已读取本地处理后的 {bible?.metadata.shortName ?? "圣经"} 数据。可继续选择经卷、章节或译本，并进入研读页整理观察、解释和应用。
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
            <StudyCreateButton
              versionCode={selectedVersion}
              bookCode={selectedBook}
              chapter={safeChapter}
              label="新建研读"
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
