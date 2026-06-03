import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { DocumentCreateForm } from "@/components/document-create-form";
import { PageHeader, Panel, Tag } from "@/components/ui";
import { requireCurrentUser } from "@/lib/auth";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import { DOCUMENT_WITH_TAGS } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    doc?: string;
  }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const selectedType =
    typeof params?.type === "string" && DOCUMENT_TYPES.includes(params.type as never)
      ? params.type
      : "全部类型";

  const documents = await prisma.document.findMany({
    where: {
      userId: user.id,
      ...(selectedType !== "全部类型" ? { fileType: selectedType } : {}),
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
    ...DOCUMENT_WITH_TAGS,
  });
  const selectedDocument =
    documents.find((document) => document.id === params?.doc) ?? documents[0] ?? null;

  return (
    <div>
      <PageHeader
        title="资料库"
        description="保存个人资料摘录、讲章材料与 Markdown 内容，资料会进入账户数据库和全局搜索。"
      />

      <div className="mb-5">
        <DocumentCreateForm />
      </div>

      <Panel className="mb-5 p-3">
        <form className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <div className="flex h-11 items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--background)] px-3">
            <Search size={18} className="text-[var(--accent)]" />
            <input
              name="q"
              defaultValue={query}
              className="h-full flex-1 bg-transparent text-sm outline-none"
              placeholder="搜索资料标题、正文或标签"
              aria-label="搜索资料"
            />
          </div>
          <select
            name="type"
            defaultValue={selectedType}
            className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
          >
            <option>全部类型</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <button className="h-11 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)]">
            搜索
          </button>
        </form>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Panel className="divide-y divide-[var(--line)] overflow-hidden">
          {documents.length > 0 ? (
            documents.map((document) => (
              <Link
                key={document.id}
                href={`/library?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(selectedType !== "全部类型" ? { type: selectedType } : {}),
                  doc: document.id,
                }).toString()}`}
                className={`block w-full border-l-4 p-4 text-left transition hover:bg-[var(--panel-soft)] ${
                  selectedDocument?.id === document.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-transparent"
              }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{document.title}</h2>
                  <span className="text-xs text-[var(--muted)]">{document.fileType}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {document.excerpt || document.originalFilename}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.tags.slice(0, 3).map((item) => (
                    <Tag key={item.tag.id}>{item.tag.name}</Tag>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <div className="p-5 text-sm leading-6 text-[var(--muted)]">
              还没有资料。新增一段书摘、讲章材料或 Markdown 内容后，就可以在这里和全局搜索中查到。
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          {selectedDocument ? (
            <>
              <div className="mb-5 border-b border-[var(--line)] pb-4">
                <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-[var(--panel-soft)] text-[var(--accent)]">
                  <FileText size={19} />
                </div>
                <h2 className="text-xl font-semibold">{selectedDocument.title}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  类型：{selectedDocument.fileType} · 更新：
                  {formatDate(selectedDocument.updatedAt)}
                </p>
              </div>
              <article className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
                {selectedDocument.extractedText || selectedDocument.excerpt || "暂无正文。"}
              </article>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedDocument.tags.length > 0 ? (
                  selectedDocument.tags.map((item) => <Tag key={item.tag.id}>{item.tag.name}</Tag>)
                ) : (
                  <Tag>未分类</Tag>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-[var(--line)] p-5 text-sm leading-6 text-[var(--muted)]">
              资料库会保存到你的账户数据库。先新增一段资料，之后可以通过标题、正文和标签搜索。
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
