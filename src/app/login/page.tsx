import { BookMarked } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

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

        <LoginForm />
      </section>
    </main>
  );
}
