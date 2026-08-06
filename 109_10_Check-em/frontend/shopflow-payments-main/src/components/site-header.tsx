import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-success text-ink-foreground shadow-glow">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Check 'em</span>
          <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            Payment Gateway
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <HeaderLink to="/">Dashboard</HeaderLink>
          <HeaderLink to="/gateway">Gateway</HeaderLink>
          <HeaderLink to="/payments">Payments</HeaderLink>
          <HeaderLink to="/contact">Contact</HeaderLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "surface-panel soft-border text-foreground shadow-card" }}
      className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function SecurityStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-success" /> PCI-DSS Level 1
      </span>
      <span>TLS 1.3 encrypted</span>
      <span>AES-256 tokenised vault</span>
      <span>RBI 2-factor compliant</span>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground">
        <p>Check 'em Payment Gateway</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/contact" className="underline underline-offset-4">
            Contact us
          </Link>
          <span>Phone: +918112377491</span>
          <span>Email: checkemsupport@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}
