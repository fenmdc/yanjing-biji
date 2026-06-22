import type { Note, StudyProject } from "@prisma/client";
import { createExcerpt } from "@/lib/notes";
import { buildStudyWorkflowBody } from "@/lib/study-workflow";

export type StudyProjectWithNote = StudyProject & {
  notes: Array<Pick<Note, "id" | "markdownBody" | "updatedAt">>;
};

export function studyProjectToClient(project: StudyProjectWithNote) {
  const primaryNote = project.notes[0];

  return {
    id: project.id,
    title: project.title,
    passageLabel: project.passageLabel,
    status: project.status,
    summary: project.summary,
    versionCode: project.versionCode,
    bookCode: project.bookCode,
    chapter: project.chapter,
    excerpt: primaryNote ? createExcerpt(primaryNote.markdownBody) : "还没有研读笔记。",
    noteId: primaryNote?.id ?? null,
    updatedAt: project.updatedAt.toISOString(),
    noteUpdatedAt: primaryNote?.updatedAt.toISOString() ?? null,
  };
}

export function createStudyMarkdown({
  title,
  passageLabel,
  versionShortName,
  verses,
}: {
  title: string;
  passageLabel: string;
  versionShortName: string;
  verses: Array<{ verse: number; text: string }>;
}) {
  const quotedVerses = verses
    .map((verse) => `> ${verse.verse} ${verse.text}`)
    .join("\n");

  return `---
type: passage
passage: ${passageLabel}
translation: ${versionShortName}
tags:
  - 研读
---

# ${title}

## 经文

${quotedVerses}

${buildStudyWorkflowBody()}
`;
}
