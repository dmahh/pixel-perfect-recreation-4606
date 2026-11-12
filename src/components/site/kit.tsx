import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  code,
  concept,
  title,
  children,
}: {
  code: string;
  concept: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="blueprint border-b">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow text-primary">
          {code} · {concept}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">{title}</h1>
        {children && <p className="mt-3 max-w-2xl text-muted-foreground">{children}</p>}
      </div>
    </section>
  );
}

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("surface p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-elegant"
          : "bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="eyebrow text-[0.6rem] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
      {hint && <p className="text-[0.7rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CategoryDot({ category }: { category: "museum" | "park" | "monument" }) {
  const cls = {
    museum: "bg-cat-museum",
    park: "bg-cat-park",
    monument: "bg-cat-monument",
  }[category];
  return <span className={cn("inline-block h-2 w-2 rounded-full", cls)} aria-hidden />;
}

export function Explainer({
  title,
  items,
  children,
}: {
  title: string;
  items: { term: string; text: ReactNode }[];
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mt-12 rounded-2xl bg-navy p-6 text-navy-foreground sm:p-10">
        <p className="eyebrow text-primary-glow">Academic notes</p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        {children && <div className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-muted">{children}</div>}
        <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.term} className="border-l border-primary-glow/40 pl-4">
              <dt className="font-display text-sm font-semibold">{it.term}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-navy-muted">{it.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
