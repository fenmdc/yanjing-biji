export type StudyWorkflowSection = {
  heading: string;
  placeholder: string;
};

export const STUDY_WORKFLOW_SECTIONS: StudyWorkflowSection[] = [
  { heading: "观察", placeholder: "- " },
  { heading: "解释", placeholder: "" },
  { heading: "应用", placeholder: "- " },
  { heading: "问题", placeholder: "- " },
  { heading: "资料摘录", placeholder: "- " },
  { heading: "祷告与行动", placeholder: "- " },
];

export function buildStudyWorkflowBody(
  sections: StudyWorkflowSection[] = STUDY_WORKFLOW_SECTIONS,
) {
  return sections
    .map((section) => formatSection(section.heading, section.placeholder))
    .join("\n");
}

export function getStudyWorkflowStatus(markdown: string) {
  return STUDY_WORKFLOW_SECTIONS.map((section) => {
    const content = extractSectionContent(markdown, section.heading);

    return {
      heading: section.heading,
      exists: content !== null,
      filled: Boolean(content && !isPlaceholderContent(content)),
    };
  });
}

export function ensureStudyWorkflowSections(markdown: string) {
  const missingSections = STUDY_WORKFLOW_SECTIONS.filter(
    (section) => extractSectionContent(markdown, section.heading) === null,
  );

  if (missingSections.length === 0) return markdown;

  const addition = missingSections
    .map((section) => formatSection(section.heading, section.placeholder))
    .join("\n");

  return `${markdown.trimEnd()}\n\n${addition}`;
}

export function insertStudySnippet(
  markdown: string,
  snippet: {
    reference: string;
    versionShortName: string;
    text: string;
  },
) {
  const nextMarkdown = ensureStudyWorkflowSections(markdown);
  const block = [
    `- ${snippet.reference}（${snippet.versionShortName}）`,
    `  > ${snippet.text}`,
  ].join("\n");

  return insertIntoSection(nextMarkdown, "资料摘录", block);
}

export function insertStudyDocumentExcerpt(
  markdown: string,
  document: {
    title: string;
    fileType: string;
    excerpt: string;
    label?: string;
  },
) {
  const nextMarkdown = ensureStudyWorkflowSections(markdown);
  const sourceLabel = document.label ? `${document.title} · ${document.label}` : document.title;
  const block = [
    `- ${sourceLabel}（${document.fileType}）`,
    `  > ${document.excerpt}`,
  ].join("\n");

  return insertIntoSection(nextMarkdown, "资料摘录", block);
}

function formatSection(heading: string, placeholder: string) {
  return `## ${heading}\n\n${placeholder}`.trimEnd();
}

function extractSectionContent(markdown: string, heading: string) {
  const escapedHeading = escapeRegExp(heading);
  const pattern = new RegExp(
    `(^|\\n)##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`,
  );
  const match = markdown.match(pattern);
  return match ? match[2].trim() : null;
}

function insertIntoSection(markdown: string, heading: string, block: string) {
  const escapedHeading = escapeRegExp(heading);
  const pattern = new RegExp(
    `(^|\\n)(##\\s+${escapedHeading}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$)`,
  );
  const match = markdown.match(pattern);
  if (!match || match.index === undefined) return `${markdown.trimEnd()}\n\n${block}`;

  const sectionStart = match.index + match[1].length;
  const sectionEnd = match.index + match[0].length;
  const section = match[0].slice(match[1].length);
  const cleanedSection = section.replace(/\n-\s*$/, "").trimEnd();
  const nextSection = `${cleanedSection}\n\n${block}\n`;

  return `${markdown.slice(0, sectionStart)}${nextSection}${markdown.slice(sectionEnd)}`;
}

function isPlaceholderContent(content: string) {
  const normalized = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return normalized === "-" || normalized === "- 待填写" || normalized === "待填写";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
