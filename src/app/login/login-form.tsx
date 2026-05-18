"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(typeof payload.error === "string" ? payload.error : "认证失败，请稍后再试。");
      return;
    }

    router.push(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-[var(--background)] p-1">
        {[
          ["login", "登录"],
          ["register", "注册"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value as AuthMode);
              setError("");
            }}
            className={`h-9 rounded-md text-sm font-semibold transition ${
              mode === value
                ? "bg-white text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "register" ? (
        <label className="mb-4 block text-sm font-semibold">
          名字
          <input
            name="name"
            className="mt-2 h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
            placeholder="你的名字"
          />
        </label>
      ) : null}

      <label className="mb-4 block text-sm font-semibold">
        邮箱
        <input
          name="email"
          type="email"
          required
          className="mt-2 h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
          placeholder="you@example.com"
        />
      </label>

      <label className="mb-4 block text-sm font-semibold">
        密码
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          className="mt-2 h-11 w-full rounded-md border border-[var(--line)] px-3 outline-none focus:border-[var(--accent)]"
          placeholder={mode === "register" ? "至少 8 个字符" : "输入密码"}
        />
      </label>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-md bg-[var(--accent)] text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "处理中..." : mode === "register" ? "创建账户" : "登录"}
      </button>
    </form>
  );
}
