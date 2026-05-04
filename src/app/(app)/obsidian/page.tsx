"use client";

import { useState } from "react";
import { Download, FileUp } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { studyMarkdown } from "@/lib/sample-data";
import { getStoredStudyMarkdown } from "@/lib/study-storage";

export default function ObsidianPage() {
  const [ready, setReady] = useState(false);

  async function exportMarkdown() {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    zip.file("Bible Notes/John 3.16-21.md", getStoredStudyMarkdown());
    zip.file(
      "Topics/恩典.md",
      `---
type: topic
tags:
  - 救恩
  - 神学主题
---

# 恩典

相关经文：约翰福音 3:16

恩典不是人配得的奖赏，而是神在基督里主动赐下的怜悯。

相关：[[救恩]] [[信心]]
`,
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yanjing-biji-obsidian-export.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Obsidian 互通"
        description="第一版采用稳妥的文件互通：导出 Markdown，保留 YAML、双链和标签；导入功能先预留入口。"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-lg font-semibold">导出到 Obsidian</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            适合把研读笔记放进自己的 Vault，继续使用 Obsidian 的双链和图谱。
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

          <div className="mt-6" onClick={exportMarkdown}>
            <Button>
              <Download size={17} />
              导出 Markdown
            </Button>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-lg font-semibold">导入 Markdown</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            后续会支持从 Obsidian 导入 .md 文件，并识别 YAML、标签与双链。
          </p>

          <button
            onClick={() => setReady(true)}
            className="mt-5 flex min-h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--background)] text-center transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            <FileUp size={28} className="mb-3 text-[var(--accent)]" />
            <span className="font-semibold">拖入 Markdown 文件</span>
            <span className="mt-1 text-sm text-[var(--muted)]">或点击选择文件</span>
          </button>

          {ready ? (
            <p className="mt-4 rounded-md bg-[var(--accent-soft)] p-3 text-sm font-semibold text-[var(--accent-strong)]">
              导入入口已预留。下一步接真实文件解析后，这里会显示导入预览。
            </p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
