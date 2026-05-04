import { Upload } from "lucide-react";
import { Button, PageHeader, Panel, Tag } from "@/components/ui";
import { resources } from "@/lib/sample-data";

export default function LibraryPage() {
  return (
    <div>
      <PageHeader
        title="资料库"
        description="第一版先把个人资料整理好：上传、分类、加标签、关联经文。"
        action={
          <Button>
            <Upload size={17} />
            上传资料
          </Button>
        }
      />

      <Panel className="mb-5 p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_150px_150px]">
          <input
            className="h-11 rounded-md border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
            placeholder="搜索资料标题、正文或经文引用"
          />
          <select className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm">
            <option>全部类型</option>
            <option>PDF</option>
            <option>Markdown</option>
            <option>TXT</option>
          </select>
          <select className="h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm">
            <option>全部经卷</option>
            <option>约翰福音</option>
            <option>罗马书</option>
          </select>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Panel className="divide-y divide-[var(--line)]">
          {resources.map((resource, index) => (
            <button
              key={resource.title}
              className={`block w-full border-l-4 p-4 text-left transition hover:bg-[var(--panel-soft)] ${
                index === 0 ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{resource.title}</h2>
                <span className="text-xs text-[var(--muted)]">{resource.type}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">关联经文：{resource.passage}</p>
            </button>
          ))}
        </Panel>

        <Panel className="p-5">
          <div className="mb-5 border-b border-[var(--line)] pb-4">
            <h2 className="text-xl font-semibold">约翰福音第三章解经摘录</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">类型：Markdown · 来源：个人上传</p>
          </div>
          <article className="max-w-3xl text-sm leading-7 text-[var(--foreground)]">
            <p>
              约翰福音第三章把重生、信心与永生放在同一条救赎逻辑中。约 3:16
              不是孤立的金句，而是回应尼哥底母对新生命的疑问。
            </p>
            <p className="mt-4">
              “神爱世人”显明救恩的源头在神自己；“赐下独生子”显明爱的行动；
              “叫一切信他的”指出人回应福音的方式；“反得永生”则指向新生命的结果。
            </p>
          </article>
          <div className="mt-5 flex flex-wrap gap-2">
            {["约翰福音", "救恩", "永生"].map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
