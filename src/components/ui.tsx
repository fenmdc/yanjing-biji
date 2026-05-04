import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-3 h-1 w-12 rounded-full bg-[var(--accent)]" />
        <h1 className="text-2xl font-semibold leading-tight tracking-normal text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
        variant === "primary" &&
          "bg-[var(--foreground)] text-white hover:bg-[var(--accent)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-[var(--panel-soft)]",
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-red-200 bg-[var(--accent-soft)] px-2.5 text-xs font-semibold text-[var(--accent-strong)]">
      #{children}
    </span>
  );
}
