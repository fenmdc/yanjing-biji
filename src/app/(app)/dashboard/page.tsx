import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Library, NotebookPen, Search, Upload } from "lucide-react";
import { Button, PageHeader, Panel, Tag } from "@/components/ui";
import { requireCurrentUser } from "@/lib/auth";
import { NOTE_TYPE_LABELS } from "@/lib/notes";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [noteCount, studyCount, documentCount, recentStudies, recentNotes] = await Promise.all([
    prisma.note.count({ where: { userId: user.id } }),
    prisma.studyProject.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { userId: user.id } }),
    prisma.studyProject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        notes: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            excerpt: true,
            updatedAt: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    }),
    prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
  ]);

  const primaryStudy = recentStudies[0] ?? null;
  const displayName = user.name || user.email.split("@")[0];
  const dashboardCards = [
    {
      title: "研读项目",
      body: `${studyCount} 个`,
      meta: primaryStudy ? `最近更新：${primaryStudy.title}` : "从圣经阅读页新建第一个研读",
      icon: BookOpen,
      href: primaryStudy ? `/study/${primaryStudy.id}` : "/bible",
    },
    {
      title: "笔记库",
      body: `${noteCount} 篇`,
      meta: recentNotes[0] ? `最新笔记：${recentNotes[0].title}` : "经文、主题、问题和讲章草稿",
      icon: NotebookPen,
      href: "/notes",
    },
    {
      title: "资料整理",
      body: `${documentCount} 个`,
      meta: "书摘、讲章材料和 Markdown 摘录已保存到资料库",
      icon: Library,
      href: "/library",
    },
  ];

  return (
    <div>
      <section className="mb-6 rounded-lg bg-[var(--foreground)] p-5 text-white shadow-[var(--shadow)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="mb-4 h-1 w-12 rounded-full bg-[var(--accent)]" />
            <h1 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-4xl">
              {displayName}，继续把读经沉淀成可检索、可关联、可导出的研读笔记。
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
              这里现在读取你的账户数据库：最近研读、最近笔记和统计数量都会随保存更新。
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs font-semibold text-zinc-400">继续入口</p>
            <p className="mt-2 text-lg font-semibold">
              {primaryStudy?.title ?? "从一章经文开始"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {primaryStudy?.passageLabel ?? "选择译本、经卷和章节后创建研读项目。"}
            </p>
            <Link
              href={primaryStudy ? `/study/${primaryStudy.id}` : "/bible"}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            >
              {primaryStudy ? "继续研读" : "打开圣经"}
            </Link>
          </div>
        </div>
      </section>

      <PageHeader
        title="工作台"
        description="快速回到最近的经文、笔记和资料，不让想法散落在不同地方。"
        action={
          <Link href={primaryStudy ? `/study/${primaryStudy.id}` : "/bible"}>
            <Button>{primaryStudy ? "继续最近研读" : "新建研读项目"}</Button>
          </Link>
        }
      />

      <Panel className="mb-6 p-3">
        <Link
          href="/search"
          className="flex h-12 items-center gap-3 rounded-md bg-[var(--background)] px-4 text-sm text-[var(--muted)]"
        >
          <Search size={18} />
          搜索经文、笔记、资料或主题，例如“恩典”“永生”“约 3:16”
        </Link>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Panel className="h-full p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-md bg-[var(--panel-soft)] text-[var(--accent)]">
                    <Icon size={19} />
                  </span>
                  <ArrowRight size={17} className="text-[var(--muted)]" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--muted)]">{card.title}</h2>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{card.body}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.meta}</p>
              </Panel>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">最近研读项目</h2>
            <Link href="/bible" className="text-sm font-semibold text-[var(--accent)]">
              新建研读
            </Link>
          </div>
          {recentStudies.length > 0 ? (
            recentStudies.map((study) => (
              <Link
                key={study.id}
                href={`/study/${study.id}`}
                className="grid gap-3 border-t border-[var(--line)] py-4 text-sm transition hover:bg-[var(--panel-soft)] sm:grid-cols-[1fr_90px_1fr]"
              >
                <span className="font-semibold">{study.title}</span>
                <span className="text-[var(--muted)]">
                  {study.status === "ACTIVE" ? "进行中" : "已归档"}
                </span>
                <span className="text-[var(--muted)]">
                  {study.notes[0]?.tags.map((item) => item.tag.name).join("、") || study.passageLabel}
                </span>
              </Link>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm leading-6 text-[var(--muted)]">
              还没有研读项目。打开圣经阅读页，选择章节后创建第一个研读项目。
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-4 text-base font-semibold">最近笔记</h2>
          <div className="grid gap-3">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="rounded-md border border-[var(--line)] p-3 transition hover:bg-[var(--panel-soft)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{note.title}</span>
                    <span className="text-xs text-[var(--muted)]">{NOTE_TYPE_LABELS[note.type]}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                    {note.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.tags.slice(0, 3).map((item) => (
                      <Tag key={item.tag.id}>{item.tag.name}</Tag>
                    ))}
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[var(--line)] p-4 text-sm leading-6 text-[var(--muted)]">
                还没有笔记。你可以从研读页保存，也可以在笔记库中新建。
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6 p-5">
        <h2 className="mb-4 text-base font-semibold">快速开始</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: "新建研读", href: "/bible", icon: NotebookPen },
            { label: "上传资料", href: "/library", icon: Upload },
            { label: "搜索笔记", href: "/search", icon: Search },
            { label: "导出 Markdown", href: "/obsidian", icon: FileText },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex h-12 items-center gap-3 rounded-md border border-[var(--line)] px-3 text-sm font-semibold transition hover:bg-[var(--panel-soft)]"
              >
                <Icon size={18} className="text-[var(--accent)]" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
