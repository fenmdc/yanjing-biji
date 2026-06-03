"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";

export function StudyCreateButton({
  versionCode,
  bookCode,
  chapter,
  label = "新建研读",
  variant = "primary",
}: {
  versionCode: string;
  bookCode: string;
  chapter: number;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setPending(true);
    const response = await fetch("/api/studies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionCode, bookCode, chapter }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (payload.study?.id) {
      router.push(`/study/${payload.study.id}`);
      return;
    }

    setError(typeof payload.error === "string" ? payload.error : "创建研读失败，请稍后再试。");
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          variant === "secondary"
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        <NotebookPen size={16} />
        {pending ? "创建中..." : label}
      </button>
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </span>
  );
}
