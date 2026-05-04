import Link from "next/link";
import { BookOpen, FileText, NotebookPen, Search } from "lucide-react";
import { PageHeader, Panel, Tag } from "@/components/ui";

const results = [
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

export default function SearchPage() {
  return (
    <div>
      <PageHeader
        title="全局搜索"
        description="把经文、研读笔记、主题标签和个人资料放在同一个检索入口里。"
      />

      <Panel className="mb-5 p-3">
        <div className="flex h-12 items-center gap-3 rounded-md bg-[var(--background)] px-4">
          <Search size={18} className="text-[var(--accent)]" />
          <input
            className="h-full flex-1 bg-transparent text-sm outline-none"
            defaultValue="永生"
            aria-label="搜索"
          />
        </div>
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

      <div className="grid gap-4">
        {results.map((result) => {
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
