import { Edit3 } from "lucide-react";
import { Button, PageHeader, Panel, Tag } from "@/components/ui";
import { notes } from "@/lib/sample-data";

export default function NotesPage() {
  return (
    <div>
      <PageHeader
        title="笔记库"
        description="统一管理经文笔记、主题笔记、问题笔记与讲章草稿。"
        action={
          <Button>
            <Edit3 size={17} />
            新建笔记
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">笔记类型</h2>
          {["全部", "经文笔记", "主题笔记", "问题笔记", "讲章草稿"].map((item, index) => (
            <button
              key={item}
              className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm ${
                index === 0
                  ? "bg-[var(--foreground)] font-semibold text-white"
                  : "text-[var(--muted)] hover:bg-[var(--panel-soft)]"
              }`}
            >
              {item}
            </button>
          ))}
        </Panel>

        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Panel key={note.title} className="p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[var(--muted)]">{note.type}</span>
                <span className="text-xs text-[var(--muted)]">{note.updatedAt}</span>
              </div>
              <h2 className="text-lg font-semibold">{note.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{note.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
