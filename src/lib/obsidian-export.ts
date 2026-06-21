import type { NoteType } from "@prisma/client";

export function createMarkdownFile({
  title,
  type,
  tags,
  body,
}: {
  title: string;
  type: string;
  tags: string[];
  body: string;
}) {
  if (body.trim().startsWith("---")) return body;

  return `---
title: ${quoteYaml(title)}
type: ${quoteYaml(type)}
tags:
${tags.length > 0 ? tags.map((tag) => `  - ${quoteYaml(tag)}`).join("\n") : "  - 未分类"}
---

# ${title}

${body}
`;
}

export function noteTypeFolder(type: NoteType) {
  const folders: Record<NoteType, string> = {
    PASSAGE: "Bible Notes",
    TOPIC: "Topics",
    QUESTION: "Questions",
    SERMON: "Sermons",
  };

  return folders[type];
}

export function safeMarkdownFilename(title: string) {
  const safe = title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);

  return `${safe || "未命名"}.md`;
}

function quoteYaml(value: string) {
  return JSON.stringify(value);
}
