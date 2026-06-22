import JSZip from "jszip";
import type {
  DocumentSource,
  DocumentVisibility,
  LinkType,
  NoteSource,
  NoteType,
  StudyStatus,
  TagType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BACKUP_FORMAT = "yanjing-biji.backup.v1";
const BACKUP_JSON_PATH = "backup.json";

type BackupTag = {
  id: string;
  name: string;
  slug: string;
  type: TagType;
};

type BackupStudy = {
  id: string;
  title: string;
  passageLabel: string;
  versionCode: string | null;
  bookCode: string | null;
  chapter: number | null;
  status: StudyStatus;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackupNote = {
  id: string;
  studyProjectId: string | null;
  type: NoteType;
  title: string;
  slug: string;
  markdownBody: string;
  excerpt: string | null;
  source: NoteSource;
  obsidianPath: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

type BackupDocument = {
  id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  storagePath: string | null;
  extractedText: string | null;
  excerpt: string | null;
  source: DocumentSource;
  visibility: DocumentVisibility;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

type BackupStudyDocument = {
  id: string;
  studyProjectId: string;
  documentId: string;
  note: string | null;
  createdAt: string;
};

type BackupNoteLink = {
  id: string;
  fromNoteId: string;
  toNoteId: string | null;
  targetTitle: string;
  linkType: LinkType;
  createdAt: string;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  account: {
    email: string;
    name: string | null;
  };
  data: {
    tags: BackupTag[];
    studies: BackupStudy[];
    notes: BackupNote[];
    documents: BackupDocument[];
    studyDocuments: BackupStudyDocument[];
    noteLinks: BackupNoteLink[];
  };
};

export type RestoreResult = {
  created: {
    tags: number;
    studies: number;
    notes: number;
    documents: number;
    studyDocuments: number;
    noteLinks: number;
  };
  skipped: {
    tags: number;
    studies: number;
    notes: number;
    documents: number;
    studyDocuments: number;
    noteLinks: number;
  };
};

export async function createBackupZip(userId: string) {
  const backup = await createBackupFile(userId);
  const zip = new JSZip();
  const exportedAt = backup.exportedAt.replace(/[:.]/g, "-");

  zip.file(BACKUP_JSON_PATH, JSON.stringify(backup, null, 2));
  zip.file(
    "README.md",
    `# 研经笔记备份

格式：${BACKUP_FORMAT}
导出时间：${backup.exportedAt}
账户：${backup.account.email}

内容：
- 标签：${backup.data.tags.length}
- 研读项目：${backup.data.studies.length}
- 笔记：${backup.data.notes.length}
- 资料：${backup.data.documents.length}
- 研读资料关联：${backup.data.studyDocuments.length}

恢复方式：登录研经笔记后，在 Obsidian / 数据安全页面上传此 zip 文件。
`,
  );

  const blob = await zip.generateAsync({ type: "blob" });

  return {
    blob,
    filename: `yanjing-biji-backup-${exportedAt}.zip`,
  };
}

export async function restoreBackupZip(userId: string, file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const backupJson = zip.file(BACKUP_JSON_PATH);

  if (!backupJson) {
    throw new Error("备份文件缺少 backup.json。");
  }

  const backup = parseBackupFile(JSON.parse(await backupJson.async("string")));
  return restoreBackupFile(userId, backup);
}

async function createBackupFile(userId: string): Promise<BackupFile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const [tags, studies, notes, documents, studyDocuments, noteLinks] = await Promise.all([
    prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.studyProject.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.studyDocument.findMany({
      where: {
        studyProject: { userId },
        document: { userId },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.noteLink.findMany({
      where: { fromNote: { userId } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    account: user,
    data: {
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        type: tag.type,
      })),
      studies: studies.map((study) => ({
        id: study.id,
        title: study.title,
        passageLabel: study.passageLabel,
        versionCode: study.versionCode,
        bookCode: study.bookCode,
        chapter: study.chapter,
        status: study.status,
        summary: study.summary,
        createdAt: study.createdAt.toISOString(),
        updatedAt: study.updatedAt.toISOString(),
      })),
      notes: notes.map((note) => ({
        id: note.id,
        studyProjectId: note.studyProjectId,
        type: note.type,
        title: note.title,
        slug: note.slug,
        markdownBody: note.markdownBody,
        excerpt: note.excerpt,
        source: note.source,
        obsidianPath: note.obsidianPath,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        tags: note.tags.map((item) => item.tag.name),
      })),
      documents: documents.map((document) => ({
        id: document.id,
        title: document.title,
        originalFilename: document.originalFilename,
        fileType: document.fileType,
        storagePath: document.storagePath,
        extractedText: document.extractedText,
        excerpt: document.excerpt,
        source: document.source,
        visibility: document.visibility,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        tags: document.tags.map((item) => item.tag.name),
      })),
      studyDocuments: studyDocuments.map((link) => ({
        id: link.id,
        studyProjectId: link.studyProjectId,
        documentId: link.documentId,
        note: link.note,
        createdAt: link.createdAt.toISOString(),
      })),
      noteLinks: noteLinks.map((link) => ({
        id: link.id,
        fromNoteId: link.fromNoteId,
        toNoteId: link.toNoteId,
        targetTitle: link.targetTitle,
        linkType: link.linkType,
        createdAt: link.createdAt.toISOString(),
      })),
    },
  };
}

async function restoreBackupFile(userId: string, backup: BackupFile): Promise<RestoreResult> {
  const result: RestoreResult = {
    created: { tags: 0, studies: 0, notes: 0, documents: 0, studyDocuments: 0, noteLinks: 0 },
    skipped: { tags: 0, studies: 0, notes: 0, documents: 0, studyDocuments: 0, noteLinks: 0 },
  };

  await prisma.$transaction(async (tx) => {
    const tagNames = new Set<string>();
    for (const tag of backup.data.tags) tagNames.add(tag.name);
    for (const note of backup.data.notes) note.tags.forEach((tag) => tagNames.add(tag));
    for (const document of backup.data.documents) document.tags.forEach((tag) => tagNames.add(tag));

    const tagSlugByName = new Map<string, string>();
    for (const tagName of tagNames) {
      const sourceTag = backup.data.tags.find((tag) => tag.name === tagName);
      const slug = sourceTag?.slug ?? makeSlug(tagName, "tag");
      const existing = await tx.tag.findUnique({
        where: { userId_slug: { userId, slug } },
        select: { id: true },
      });

      if (existing) {
        result.skipped.tags += 1;
      } else {
        await tx.tag.create({
          data: {
            userId,
            name: tagName,
            slug,
            type: sourceTag?.type ?? "CUSTOM",
          },
        });
        result.created.tags += 1;
      }

      tagSlugByName.set(tagName, slug);
    }

    const studyIdMap = new Map<string, string>();
    for (const study of backup.data.studies) {
      const existing = await tx.studyProject.findFirst({
        where: {
          userId,
          title: study.title,
          passageLabel: study.passageLabel,
        },
        select: { id: true },
      });

      if (existing) {
        studyIdMap.set(study.id, existing.id);
        result.skipped.studies += 1;
        continue;
      }

      const created = await tx.studyProject.create({
        data: {
          userId,
          title: study.title,
          passageLabel: study.passageLabel,
          versionCode: study.versionCode,
          bookCode: study.bookCode,
          chapter: study.chapter,
          status: study.status,
          summary: study.summary,
          createdAt: new Date(study.createdAt),
          updatedAt: new Date(study.updatedAt),
        },
        select: { id: true },
      });
      studyIdMap.set(study.id, created.id);
      result.created.studies += 1;
    }

    const noteIdMap = new Map<string, string>();
    for (const note of backup.data.notes) {
      const existing = await tx.note.findUnique({
        where: {
          userId_slug: {
            userId,
            slug: note.slug,
          },
        },
        select: { id: true },
      });

      if (existing) {
        noteIdMap.set(note.id, existing.id);
        result.skipped.notes += 1;
        continue;
      }

      const created = await tx.note.create({
        data: {
          userId,
          studyProjectId: note.studyProjectId ? studyIdMap.get(note.studyProjectId) ?? null : null,
          type: note.type,
          title: note.title,
          slug: note.slug,
          markdownBody: note.markdownBody,
          excerpt: note.excerpt,
          source: note.source,
          obsidianPath: note.obsidianPath,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          tags: createTagLinks(userId, note.tags, tagSlugByName),
        },
        select: { id: true },
      });
      noteIdMap.set(note.id, created.id);
      result.created.notes += 1;
    }

    const documentIdMap = new Map<string, string>();
    for (const document of backup.data.documents) {
      const existing = await tx.document.findFirst({
        where: {
          userId,
          title: document.title,
          originalFilename: document.originalFilename,
        },
        select: { id: true },
      });

      if (existing) {
        documentIdMap.set(document.id, existing.id);
        result.skipped.documents += 1;
        continue;
      }

      const created = await tx.document.create({
        data: {
          userId,
          title: document.title,
          originalFilename: document.originalFilename,
          fileType: document.fileType,
          storagePath: document.storagePath,
          extractedText: document.extractedText,
          excerpt: document.excerpt,
          source: document.source,
          visibility: document.visibility,
          createdAt: new Date(document.createdAt),
          updatedAt: new Date(document.updatedAt),
          tags: createTagLinks(userId, document.tags, tagSlugByName),
        },
        select: { id: true },
      });
      documentIdMap.set(document.id, created.id);
      result.created.documents += 1;
    }

    for (const link of backup.data.studyDocuments) {
      const studyProjectId = studyIdMap.get(link.studyProjectId);
      const documentId = documentIdMap.get(link.documentId);

      if (!studyProjectId || !documentId) {
        result.skipped.studyDocuments += 1;
        continue;
      }

      const existing = await tx.studyDocument.findUnique({
        where: {
          studyProjectId_documentId: {
            studyProjectId,
            documentId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        result.skipped.studyDocuments += 1;
        continue;
      }

      await tx.studyDocument.create({
        data: {
          studyProjectId,
          documentId,
          note: link.note,
          createdAt: new Date(link.createdAt),
        },
      });
      result.created.studyDocuments += 1;
    }

    for (const link of backup.data.noteLinks) {
      const fromNoteId = noteIdMap.get(link.fromNoteId);
      if (!fromNoteId) {
        result.skipped.noteLinks += 1;
        continue;
      }

      const toNoteId = link.toNoteId ? noteIdMap.get(link.toNoteId) ?? null : null;
      const existing = await tx.noteLink.findFirst({
        where: {
          fromNoteId,
          targetTitle: link.targetTitle,
          linkType: link.linkType,
        },
        select: { id: true },
      });

      if (existing) {
        result.skipped.noteLinks += 1;
        continue;
      }

      await tx.noteLink.create({
        data: {
          fromNoteId,
          toNoteId,
          targetTitle: link.targetTitle,
          linkType: link.linkType,
          createdAt: new Date(link.createdAt),
        },
      });
      result.created.noteLinks += 1;
    }
  });

  return result;
}

function createTagLinks(userId: string, tags: string[], slugByName: Map<string, string>) {
  return {
    create: tags.map((tag) => {
      const slug = slugByName.get(tag) ?? makeSlug(tag, "tag");
      return {
        tag: {
          connectOrCreate: {
            where: { userId_slug: { userId, slug } },
            create: { userId, name: tag, slug },
          },
        },
      };
    }),
  };
}

function parseBackupFile(value: unknown): BackupFile {
  const backup = value as Partial<BackupFile>;

  if (backup.format !== BACKUP_FORMAT || backup.version !== 1 || !backup.data) {
    throw new Error("这不是兼容的研经笔记备份文件。");
  }

  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: stringOrNow(backup.exportedAt),
    account: {
      email: typeof backup.account?.email === "string" ? backup.account.email : "",
      name: typeof backup.account?.name === "string" ? backup.account.name : null,
    },
    data: {
      tags: arrayOf(backup.data.tags).map(normalizeTag),
      studies: arrayOf(backup.data.studies).map(normalizeStudy),
      notes: arrayOf(backup.data.notes).map(normalizeNote),
      documents: arrayOf(backup.data.documents).map(normalizeDocument),
      studyDocuments: arrayOf(backup.data.studyDocuments).map(normalizeStudyDocument),
      noteLinks: arrayOf(backup.data.noteLinks).map(normalizeNoteLink),
    },
  };
}

function normalizeTag(value: unknown): BackupTag {
  const item = value as Partial<BackupTag>;
  const name = stringOrDefault(item.name, "未命名标签");
  return {
    id: stringOrDefault(item.id, makeSlug(name, "tag")),
    name,
    slug: stringOrDefault(item.slug, makeSlug(name, "tag")),
    type: normalizeEnum(item.type, ["TOPIC", "BOOK", "CUSTOM", "DOCTRINE"], "CUSTOM"),
  };
}

function normalizeStudy(value: unknown): BackupStudy {
  const item = value as Partial<BackupStudy>;
  return {
    id: stringOrDefault(item.id, crypto.randomUUID()),
    title: stringOrDefault(item.title, "未命名研读"),
    passageLabel: stringOrDefault(item.passageLabel, "研读经文"),
    versionCode: nullableString(item.versionCode),
    bookCode: nullableString(item.bookCode),
    chapter: nullableNumber(item.chapter),
    status: normalizeEnum(item.status, ["ACTIVE", "ARCHIVED"], "ACTIVE"),
    summary: nullableString(item.summary),
    createdAt: stringOrNow(item.createdAt),
    updatedAt: stringOrNow(item.updatedAt),
  };
}

function normalizeNote(value: unknown): BackupNote {
  const item = value as Partial<BackupNote>;
  return {
    id: stringOrDefault(item.id, crypto.randomUUID()),
    studyProjectId: nullableString(item.studyProjectId),
    type: normalizeEnum(item.type, ["PASSAGE", "TOPIC", "QUESTION", "SERMON"], "PASSAGE"),
    title: stringOrDefault(item.title, "未命名研经笔记"),
    slug: stringOrDefault(item.slug, makeSlug(item.title ?? "note", "note")),
    markdownBody: stringOrDefault(item.markdownBody, ""),
    excerpt: nullableString(item.excerpt),
    source: normalizeEnum(item.source, ["INTERNAL", "OBSIDIAN_IMPORT"], "INTERNAL"),
    obsidianPath: nullableString(item.obsidianPath),
    createdAt: stringOrNow(item.createdAt),
    updatedAt: stringOrNow(item.updatedAt),
    tags: arrayOf(item.tags).map((tag) => stringOrDefault(tag, "")).filter(Boolean),
  };
}

function normalizeDocument(value: unknown): BackupDocument {
  const item = value as Partial<BackupDocument>;
  const title = stringOrDefault(item.title, "未命名资料");
  return {
    id: stringOrDefault(item.id, crypto.randomUUID()),
    title,
    originalFilename: stringOrDefault(item.originalFilename, `${title}.txt`),
    fileType: stringOrDefault(item.fileType, "摘录"),
    storagePath: nullableString(item.storagePath),
    extractedText: nullableString(item.extractedText),
    excerpt: nullableString(item.excerpt),
    source: normalizeEnum(item.source, ["UPLOAD", "OBSIDIAN_IMPORT"], "UPLOAD"),
    visibility: normalizeEnum(item.visibility, ["PRIVATE", "SHARED", "PUBLIC_SUBMISSION"], "PRIVATE"),
    createdAt: stringOrNow(item.createdAt),
    updatedAt: stringOrNow(item.updatedAt),
    tags: arrayOf(item.tags).map((tag) => stringOrDefault(tag, "")).filter(Boolean),
  };
}

function normalizeStudyDocument(value: unknown): BackupStudyDocument {
  const item = value as Partial<BackupStudyDocument>;
  return {
    id: stringOrDefault(item.id, crypto.randomUUID()),
    studyProjectId: stringOrDefault(item.studyProjectId, ""),
    documentId: stringOrDefault(item.documentId, ""),
    note: nullableString(item.note),
    createdAt: stringOrNow(item.createdAt),
  };
}

function normalizeNoteLink(value: unknown): BackupNoteLink {
  const item = value as Partial<BackupNoteLink>;
  return {
    id: stringOrDefault(item.id, crypto.randomUUID()),
    fromNoteId: stringOrDefault(item.fromNoteId, ""),
    toNoteId: nullableString(item.toNoteId),
    targetTitle: stringOrDefault(item.targetTitle, "未命名链接"),
    linkType: normalizeEnum(item.linkType, ["OBSIDIAN_WIKILINK", "MANUAL"], "OBSIDIAN_WIKILINK"),
    createdAt: stringOrNow(item.createdAt),
  };
}

function arrayOf(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNow(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : new Date().toISOString();
}

function normalizeEnum<const T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
) {
  return typeof value === "string" && values.includes(value as T) ? (value as T) : fallback;
}

function makeSlug(value: string, fallback: string) {
  return (
    value
      .trim()
      .toLocaleLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}
