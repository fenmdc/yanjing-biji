import Link from "next/link";
import {
  BookOpen,
  FileText,
  Library,
  NotebookPen,
  Search as SearchIcon,
} from "lucide-react";
import { ScriptureSaveButton } from "@/components/scripture-save-button";
import { PageHeader, Panel, Tag } from "@/components/ui";
import { requireCurrentUser } from "@/lib/auth";
import { getBibleManifest, searchBible } from "@/lib/bible-files";
import { NOTE_TYPE_LABELS } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

const filters = [
  { label: "全部", value: "all" },
  { label: "经文", value: "scripture" },
  { label: "笔记", value: "notes" },
  { label: "研读", value: "studies" },
  { label: "资料", value: "documents" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    version?: string;
    type?: string;
  }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const selectedVersion = params?.version ?? "chinese_union_simp";
  const selectedType = filters.some((filter) => filter.value === params?.type)
    ? params?.type ?? "all"
    : "all";
  const versions = getBibleManifest();
  const hasQuery = query.length > 0;
  const showScripture = selectedType === "all" || selectedType === "scripture";
  const showNotes = selectedType === "all" || selectedType === "notes";
  const showStudies = selectedType === "all" || selectedType === "studies";
  const showDocuments = selectedType === "all" || selectedType === "documents";

  const [bibleResults, noteResults, studyResults, documentResults] = await Promise.all([
    showScripture && hasQuery
      ? Promise.resolve(searchBible({ query, versionCode: selectedVersion, limit: 25 }))
      : Promise.resolve([]),
    showNotes ? searchNotes(user.id, query) : Promise.resolve([]),
    showStudies ? searchStudies(user.id, query) : Promise.resolve([]),
    showDocuments ? searchDocuments(user.id, query) : Promise.resolve([]),
  ]);

  const totalResults =
    bibleResults.length + noteResults.length + studyResults.length + documentResults.length;

  return (
    <div>
      <PageHeader
        title="全局搜索"
        description="把经文、研读项目、笔记、标签和个人资料放在同一个检索入口里。"
      />

      <Panel className="mb-5 p-3">
        <form
          action="/search"
          className="grid gap-3 rounded-md bg-[var(--background)] p-3 md:grid-cols-[1fr_180px_auto]"
        >
          <div className="flex h-11 items-center gap-3 rounded-md border border-[var(--line)] bg-white px-3">
            <SearchIcon size={18} className="text-[var(--accent)]" />
            <input
              name="q"
              className="h-full flex-1 bg-transparent text-sm outline-none"
              defaultValue={query}
              placeholder="搜索经文、笔记、研读或资料"
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
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={`/search?${new URLSearchParams({
              q: query,
              version: selectedVersion,
              type: filter.value,
            }).toString()}`}
            className={`inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold ${
              selectedType === filter.value
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--muted)]"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mb-5 rounded-md border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
        {hasQuery
          ? `“${query}” 共找到 ${totalResults} 条结果。`
          : "输入关键词后会同时搜索经文、笔记、研读项目和资料。当前显示最近内容。"}
      </div>

      {showScripture ? (
        <ResultSection
          title="经文结果"
          meta={
            hasQuery
              ? bibleResults.length > 0
                ? `找到 ${bibleResults.length} 条，显示前 25 条`
                : "没有找到匹配经文"
              : "输入关键词后搜索经文"
          }
        >
          {bibleResults.map((result) => (
            <Panel
              key={`${result.versionCode}-${result.bookCode}-${result.chapter}-${result.verse}`}
              className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              <div className="flex gap-4">
                <ResultIcon icon={BookOpen} />
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
        </ResultSection>
      ) : null}

      {showStudies ? (
        <ResultSection
          title="研读项目"
          meta={studyResults.length > 0 ? `找到 ${studyResults.length} 个` : "没有匹配研读项目"}
        >
          {studyResults.map((study) => (
            <Link href={`/study/${study.id}`} key={study.id}>
              <Panel className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="flex gap-4">
                  <ResultIcon icon={NotebookPen} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--muted)]">研读</p>
                    <h2 className="mt-1 text-lg font-semibold">{study.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {study.summary || study.notes[0]?.excerpt || study.passageLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag>{study.passageLabel}</Tag>
                      {study.notes[0]?.tags.slice(0, 3).map((item) => (
                        <Tag key={item.tag.id}>{item.tag.name}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </ResultSection>
      ) : null}

      {showNotes ? (
        <ResultSection
          title="笔记结果"
          meta={noteResults.length > 0 ? `找到 ${noteResults.length} 篇` : "没有匹配笔记"}
        >
          {noteResults.map((note) => (
            <Link href={`/notes/${note.id}`} key={note.id}>
              <Panel className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="flex gap-4">
                  <ResultIcon icon={FileText} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      笔记 · {NOTE_TYPE_LABELS[note.type]}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">{note.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {note.excerpt || "暂无摘要。"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {note.tags.slice(0, 4).map((item) => (
                        <Tag key={item.tag.id}>{item.tag.name}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </ResultSection>
      ) : null}

      {showDocuments ? (
        <ResultSection
          title="资料结果"
          meta={documentResults.length > 0 ? `找到 ${documentResults.length} 个` : "没有匹配资料"}
        >
          {documentResults.map((document) => (
            <Link href="/library" key={document.id}>
              <Panel className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="flex gap-4">
                  <ResultIcon icon={Library} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      资料 · {document.fileType}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">{document.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {document.excerpt || document.originalFilename}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {document.tags.slice(0, 4).map((item) => (
                        <Tag key={item.tag.id}>{item.tag.name}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </ResultSection>
      ) : null}
    </div>
  );
}

async function searchNotes(userId: string, query: string) {
  return prisma.note.findMany({
    where: {
      userId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { excerpt: { contains: query, mode: "insensitive" as const } },
              { markdownBody: { contains: query, mode: "insensitive" as const } },
              {
                tags: {
                  some: {
                    tag: {
                      name: { contains: query, mode: "insensitive" as const },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: query ? 12 : 5,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

async function searchStudies(userId: string, query: string) {
  return prisma.studyProject.findMany({
    where: {
      userId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { passageLabel: { contains: query, mode: "insensitive" as const } },
              { summary: { contains: query, mode: "insensitive" as const } },
              {
                notes: {
                  some: {
                    markdownBody: { contains: query, mode: "insensitive" as const },
                  },
                },
              },
              {
                notes: {
                  some: {
                    tags: {
                      some: {
                        tag: {
                          name: { contains: query, mode: "insensitive" as const },
                        },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: query ? 12 : 5,
    include: {
      notes: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
  });
}

async function searchDocuments(userId: string, query: string) {
  return prisma.document.findMany({
    where: {
      userId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { originalFilename: { contains: query, mode: "insensitive" as const } },
              { excerpt: { contains: query, mode: "insensitive" as const } },
              { extractedText: { contains: query, mode: "insensitive" as const } },
              {
                tags: {
                  some: {
                    tag: {
                      name: { contains: query, mode: "insensitive" as const },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: query ? 12 : 5,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

function ResultSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between border-t border-[var(--line)] pt-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-[var(--muted)]">{meta}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function ResultIcon({ icon: Icon }: { icon: React.ComponentType<{ size?: number }> }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--panel-soft)] text-[var(--accent)]">
      <Icon size={19} />
    </span>
  );
}
