"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  Database,
  Home,
  LogOut,
  NotebookPen,
  Search,
  ScrollText,
  Settings,
} from "lucide-react";
import { navItems } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name: string | null;
    email: string;
  };
}) {
  const pathname = usePathname();
  const mobileItems = [
    { href: "/dashboard", label: "工作台", icon: Home },
    { href: "/bible", label: "圣经", icon: BookOpen },
    { href: "/study/john-3-16", label: "研读", icon: NotebookPen },
    { href: "/notes", label: "笔记", icon: ScrollText },
    { href: "/settings", label: "设置", icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-black bg-[var(--foreground)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--accent)] text-white">
              <BookMarked size={19} strokeWidth={2.2} />
            </span>
            <span className="hidden text-base font-semibold tracking-normal text-white sm:block">
              研经笔记
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition",
                    active && "bg-white text-[var(--foreground)]",
                    !active && "hover:bg-zinc-800 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/search"
            className="ml-auto hidden h-10 w-64 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white xl:flex"
          >
            <Search size={16} />
            搜索经文、笔记、资料
          </Link>

          <div className="ml-auto hidden min-w-0 items-center gap-3 md:flex xl:ml-0">
            <div className="min-w-0 text-right">
              <Link
                href="/settings"
                className="block truncate text-xs font-semibold text-white transition hover:text-zinc-200"
              >
                {user.name || user.email}
              </Link>
              <p className="truncate text-[11px] text-zinc-400">已登录</p>
            </div>
            <Link
              href="/settings"
              className="flex size-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              aria-label="打开设置"
            >
              <Settings size={17} />
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                退出
              </button>
            </form>
          </div>

          <Link
            href="/library"
            className="flex size-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-white lg:hidden"
            aria-label="打开资料库"
          >
            <Database size={19} />
          </Link>

          <form action="/logout" method="post" className="md:hidden">
            <button
              type="submit"
              className="flex size-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-white"
              aria-label="退出登录"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black bg-[var(--foreground)] px-2 py-2 text-white shadow-[0_-12px_30px_rgba(0,0,0,0.18)] lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold text-zinc-400",
                  active && "bg-white text-[var(--foreground)]",
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
