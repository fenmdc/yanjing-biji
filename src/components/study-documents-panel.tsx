"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, FileText, Search, Unlink } from "lucide-react";
import { Tag } from "@/components/ui";

export type StudyDocumentItem = {
  id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  excerpt: string;
  extractedText: string;
  tags: string[];
  updatedAt: string;
};

export type LinkedStudyDocument = {
  linkId: string;
  note: string | null;
  linkedAt: string;
  document: StudyDocumentItem;
};

export function StudyDocumentsPanel({
  studyId,
  onInsertExcerpt,
}: {
  studyId: string;
  onInsertExcerpt: (document: StudyDocumentItem) => void;
}) {
  const [linkedDocuments, setLinkedDocuments] = useState<LinkedStudyDocument[]>([]);
  const [candidates, setCandidates] = useState<StudyDocumentItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const linkedCount = linkedDocuments.length;
  const emptyHint = useMemo(
    () => (query.trim() ? "没有找到可关联资料。" : "资料库里的资料会显示在这里。"),
    [query],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      setError("");

      const searchParams = new URLSearchParams();
      if (query.trim()) searchParams.set("q", query.trim());

      const response = await fetch(
        `/api/studies/${studyId}/documents${searchParams.size ? `?${searchParams}` : ""}`,
      );
      const payload = await response.json().catch(() => ({}));

      if (cancelled) return;
      setLoading(false);

      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "读取关联资料失败。");
        return;
      }

      setLinkedDocuments(Array.isArray(payload.linkedDocuments) ? payload.linkedDocuments : []);
      setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
    }

    const timer = window.setTimeout(() => {
      loadDocuments();
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, studyId]);

  async function handleLink(documentId: string) {
    setBusyId(documentId);
    setError("");

    const response = await fetch(`/api/studies/${studyId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusyId("");

    if (!response.ok || !payload.linkedDocument) {
      setError(typeof payload.error === "string" ? payload.error : "关联资料失败。");
      return;
    }

    setLinkedDocuments((current) => [payload.linkedDocument, ...current]);
    setCandidates((current) => current.filter((item) => item.id !== documentId));
  }

  async function handleUnlink(documentId: string) {
    setBusyId(documentId);
    setError("");

    const response = await fetch(
      `/api/studies/${studyId}/documents?${new URLSearchParams({ documentId })}`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => ({}));
    setBusyId("");

    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "取消关联失败。");
      return;
    }

    const removed = linkedDocuments.find((item) => item.document.id === documentId)?.document;
    setLinkedDocuments((current) => current.filter((item) => item.document.id !== documentId));
    if (removed) setCandidates((current) => [removed, ...current]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--muted)]">关联资料</h2>
        <span className="text-xs font-semibold text-[var(--muted)]">{linkedCount} 个</span>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {linkedDocuments.length > 0 ? (
          linkedDocuments.map((item) => (
            <DocumentCard
              key={item.linkId}
              document={item.document}
              actionLabel="摘录"
              actionIcon={<FileText size={14} />}
              disabled={busyId === item.document.id}
              onAction={() => onInsertExcerpt(item.document)}
              secondaryAction={{
                label: "取消",
                icon: <Unlink size={14} />,
                onClick: () => handleUnlink(item.document.id),
              }}
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
            还没有关联资料。可以从下方搜索资料库并加入当前研读。
          </div>
        )}
      </div>

      <div className="flex h-9 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--background)] px-2.5">
        <Search size={15} className="text-[var(--accent)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none"
          placeholder="搜索资料库"
          aria-label="搜索资料库"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-md border border-[var(--line)] p-3 text-xs text-[var(--muted)]">
            读取资料中...
          </div>
        ) : candidates.length > 0 ? (
          candidates.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              actionLabel="关联"
              actionIcon={<FilePlus2 size={14} />}
              disabled={busyId === document.id}
              onAction={() => handleLink(document.id)}
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]">
            {emptyHint}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  actionLabel,
  actionIcon,
  disabled,
  onAction,
  secondaryAction,
}: {
  document: StudyDocumentItem;
  actionLabel: string;
  actionIcon: React.ReactNode;
  disabled?: boolean;
  onAction: () => void;
  secondaryAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
}) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--background)] p-3">
      <Link
        href={`/library?doc=${document.id}`}
        className="text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]"
      >
        {document.title}
      </Link>
      <p className="mt-1 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
        {document.excerpt || document.originalFilename}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag>{document.fileType}</Tag>
        {document.tags.slice(0, 2).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionIcon}
          {actionLabel}
        </button>
        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={disabled}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
