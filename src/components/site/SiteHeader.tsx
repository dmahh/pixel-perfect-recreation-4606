import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/itinerary", label: "Itinerary agent", code: "01" },
  { to: "/route-planner", label: "A* route planner", code: "02" },
  { to: "/bayesian", label: "Bayesian network", code: "03" },
] as const;

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-navy" />
      <circle cx="16" cy="11" r="4.5" className="fill-highlight" />
      <path d="M16 15.5 L12 27 H20 Z" className="fill-primary-glow" />
      <path d="M9 9 L13 12 M23 9 L19 12" className="stroke-primary-glow" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold">Smart Astana</span>
            <span className="eyebrow block text-[0.6rem] text-muted-foreground">AI tourist guide</span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 md:hidden">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </header>
  );
}

function NavItem({ to, label, code }: (typeof NAV)[number]) {
  return (
    <Link
      to={to}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
      )}
      activeProps={{ className: "bg-secondary !text-primary" }}
    >
      <span className="font-mono text-[0.65rem] text-primary/70">{code}</span>
      {label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Smart Astana — an academic demo of intelligent agents, A* search and Bayesian networks.</p>
        <p>Prices and visit times are sample data. Map data © OpenStreetMap contributors.</p>
      </div>
    </footer>
  );
}
