"use client";

import { ObsidianExportButton } from "@/components/obsidian-export-button";
import { ObsidianImportPanel } from "@/components/obsidian-import-panel";
import { PageHeader, Panel } from "@/components/ui";

export default function ObsidianPage() {
  return (
    <div>
      <PageHeader
        title="Obsidian 互通"
        description="采用稳妥的文件互通：导出真实 Markdown，也能从 Obsidian 导入 .md 文件。"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-lg font-semibold">导出到 Obsidian</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            从账户数据库导出真实笔记、研读项目和资料，放进自己的 Vault 继续使用。
          </p>

          <div className="mt-5 grid gap-3">
            {["当前研读", "全部笔记", "指定标签"].map((item, index) => (
              <label
                key={item}
                className="flex h-11 items-center gap-3 rounded-md border border-[var(--line)] px-3 text-sm"
              >
                <input type="radio" name="export" defaultChecked={index === 0} />
                {item}
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            {["保留 YAML frontmatter", "保留 [[双链]]", "保留 #标签", "按笔记类型分文件夹"].map(
              (item) => (
                <label key={item} className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked />
                  {item}
                </label>
              ),
            )}
          </div>

          <div className="mt-6">
            <ObsidianExportButton />
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-lg font-semibold">导入 Markdown</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            从 Obsidian 导入 .md 文件，并识别 YAML、标签与正文标题，保存到当前账户数据库。
          </p>

          <ObsidianImportPanel />
        </Panel>
      </div>
    </div>
  );
}
