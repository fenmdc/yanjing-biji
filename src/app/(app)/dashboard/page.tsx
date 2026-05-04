import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { dashboardCards, quickActions } from "@/lib/sample-data";

export default function DashboardPage() {
  return (
    <div>
      <section className="mb-6 rounded-lg bg-[var(--foreground)] p-5 text-white shadow-[var(--shadow)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="mb-4 h-1 w-12 rounded-full bg-[var(--accent)]" />
            <h1 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-4xl">
              把每天的读经，沉淀成可检索、可关联、可导出的研读笔记。
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
              当前第一版聚焦核心闭环：经文阅读、Markdown 研读、标签双链、资料关联与
              Obsidian 导出。
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs font-semibold text-zinc-400">今日入口</p>
            <p className="mt-2 text-lg font-semibold">约翰福音 3:16-21</p>
            <Link
              href="/study/john-3-16"
              className="mt-4 inline-flex h-10 items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            >
              进入研读
            </Link>
          </div>
        </div>
      </section>

      <PageHeader
        title="工作台"
        description="快速回到最近的经文、笔记和资料，不让想法散落在不同地方。"
        action={
          <Link href="/study/john-3-16">
            <Button>继续约翰福音 3:16-21</Button>
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
            <Panel key={card.title} className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-md bg-[var(--panel-soft)] text-[var(--accent)]">
                  <Icon size={19} />
                </span>
                <ArrowRight size={17} className="text-[var(--muted)]" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--muted)]">{card.title}</h2>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{card.body}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.meta}</p>
            </Panel>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">最近研读项目</h2>
            <Link href="/study/john-3-16" className="text-sm font-semibold text-[var(--accent)]">
              打开研读
            </Link>
          </div>
          {[
            ["约翰福音 3:16-21", "进行中", "救恩、信心、永生"],
            ["罗马书 8:1-11", "草稿", "圣灵、生命、称义"],
            ["诗篇 23", "已归档", "牧者、安慰、同行"],
          ].map((row) => (
            <div
              key={row[0]}
              className="grid gap-3 border-t border-[var(--line)] py-4 text-sm sm:grid-cols-[1fr_90px_1fr]"
            >
              <span className="font-semibold">{row[0]}</span>
              <span className="text-[var(--muted)]">{row[1]}</span>
              <span className="text-[var(--muted)]">{row[2]}</span>
            </div>
          ))}
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-4 text-base font-semibold">快速开始</h2>
          <div className="grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex h-12 items-center gap-3 rounded-md border border-[var(--line)] px-3 text-sm font-semibold transition hover:bg-[var(--panel-soft)]"
                >
                  <Icon size={18} className="text-[var(--accent)]" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
