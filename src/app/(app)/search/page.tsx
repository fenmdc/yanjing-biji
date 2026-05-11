import Link from "next/link";
import { BookOpen, FileText, NotebookPen, Search } from "lucide-react";
import { ScriptureSaveButton } from "@/components/scripture-save-button";
import { PageHeader, Panel, Tag } from "@/components/ui";
import { getBibleManifest, searchBible } from "@/lib/bible-files";

const sampleResults = [
  {
    icon: BookOpen,
    type: "经文",
    title: "约翰福音 3:16",
    body: "神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。",
    href: "/bible",
    tags: ["救恩", "永生"],
  },
  {
    icon: NotebookPen,
    type: "笔记",
    title: "约翰福音 3:16-21 研读",
    body: "经文的焦点不是抽象的爱，而是神主动赐下子的救赎行动。",
    href: "/study/john-3-16",
    tags: ["信心", "永生"],
  },
  {
    icon: FileText,
    type: "资料",
    title: "约翰福音第三章解经摘录",
    body: "约 3:16 不是孤立的金句，而是回应尼哥底母对新生命的疑问。",
    href: "/library",
    tags: ["约翰福音", "救恩"],
  },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    version?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim() || "永生";
  const selectedVersion = params?.version ?? "chinese_union_simp";
  const versions = getBibleManifest();
  const bibleResults = searchBible({
    query,
    versionCode: selectedVersion,
    limit: 25,
  });

  return (
    <div>
      <PageHeader
        title="全局搜索"
        description="把经文、研读笔记、主题标签和个人资料放在同一个检索入口里。"
      />

      <Panel className="mb-5 p-3">
        <form
          action="/search"
          className="grid gap-3 rounded-md bg-[var(--background)] p-3 md:grid-cols-[1fr_180px_auto]"
        >
          <div className="flex h-11 items-center gap-3 rounded-md border border-[var(--line)] bg-white px-3">
          <Search size={18} className="text-[var(--accent)]" />
          <input
            name="q"
            className="h-full flex-1 bg-transparent text-sm outline-none"
            defaultValue={query}
            aria-label="搜索"
          />
          </div>
          <select
            name="version"
            defaultValue={selectedVersion}
            className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
          >
            {versions.map((version) => (
              <option key={version.code} value={version.code}>
                {version.shortName}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-md bg-[var(--foreground)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent)]">
            搜索
          </button>
        </form>
      </Panel>

      <div className="mb-5 flex flex-wrap gap-2">
        {["全部", "经文", "笔记", "资料", "主题"].map((item, index) => (
          <button
            key={item}
            className={`h-9 rounded-md px-3 text-sm font-semibold ${
              index === 0
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--muted)]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">经文结果</h2>
        <p className="text-sm text-[var(--muted)]">
          {bibleResults.length > 0
            ? `找到 ${bibleResults.length} 条，显示前 25 条`
            : "没有找到匹配经文"}
        </p>
      </div>

      <div className="mb-8 grid gap-4">
        {bibleResults.map((result) => (
          <Panel
            key={`${result.versionCode}-${result.bookCode}-${result.chapter}-${result.verse}`}
            className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--panel-soft)] text-[var(--accent)]">
                <BookOpen size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--muted)]">
                  经文 · {result.versionShortName}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{result.reference}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{result.text}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Tag>{result.bookName}</Tag>
                  <Tag>{result.versionShortName}</Tag>
                  <Link
                    href={`/bible?version=${result.versionCode}&book=${result.bookCode}&chapter=${result.chapter}`}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent)]"
                  >
                    打开章节
                  </Link>
                  <ScriptureSaveButton
                    snippet={{
                      id: `${result.versionCode}-${result.bookCode}-${result.chapter}-${result.verse}`,
                      reference: result.reference,
                      text: result.text,
                      versionCode: result.versionCode,
                      versionShortName: result.versionShortName,
                      href: `/bible?version=${result.versionCode}&book=${result.bookCode}&chapter=${result.chapter}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between border-t border-[var(--line)] pt-5">
        <h2 className="text-base font-semibold">笔记与资料示例</h2>
        <p className="text-sm text-[var(--muted)]">下一步会接入真实笔记库</p>
      </div>

      <div className="grid gap-4">
        {sampleResults.map((result) => {
          const Icon = result.icon;
          return (
            <Link href={result.href} key={result.title}>
              <Panel className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--panel-soft)] text-[var(--accent)]">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">{result.type}</p>
                    <h2 className="mt-1 text-lg font-semibold">{result.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{result.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
