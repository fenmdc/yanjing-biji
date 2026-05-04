import Link from "next/link";
import { BookMarked } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <section className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--accent)] text-white">
            <BookMarked size={20} />
          </span>
          <div>
            <h1 className="text-xl font-semibold">研经笔记</h1>
            <p className="text-sm text-[var(--muted)]">登录后继续你的个人研读。</p>
          </div>
        </div>

        <label className="mb-4 block text-sm font-semibold">
          邮箱
          <input
            className="mt-2 h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
            placeholder="you@example.com"
          />
        </label>
        <label className="mb-5 block text-sm font-semibold">
          密码
          <input
            type="password"
            className="mt-2 h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
            placeholder="输入密码"
          />
        </label>
        <Link
          href="/dashboard"
          className="flex h-11 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-semibold text-white"
        >
          登录
        </Link>
      </section>
    </main>
  );
}
