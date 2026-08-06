import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-teal-700 bg-teal-600 text-white shadow-lg transition-colors duration-300 dark:border-teal-800 dark:bg-teal-900">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl transition-transform duration-300 hover:scale-105 sm:h-20 sm:w-20">
            <img
              src="/logo.jpg"
              alt="Check 'em logo"
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            />
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Check 'em
            </h1>

            <span className="hidden rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur sm:inline-flex">
              Payment Gateway
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-3 sm:text-base">
          <HeaderLink to="/">Dashboard</HeaderLink>
          <HeaderLink to="/gateway">Gateway</HeaderLink>
          <HeaderLink to="/payments">Payments</HeaderLink>
          <HeaderLink to="/contact">Contact</HeaderLink>

          <div className="ml-2 rounded-xl border border-white/30 bg-white/20 p-1 backdrop-blur-md shadow-md">
  <ThemeToggle  />
</div>
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      activeProps={{
        className:
          "!bg-white !text-teal-700 shadow-lg dark:!bg-teal-100 dark:!text-teal-900",
      }}
      className="rounded-lg px-4 py-2 font-medium text-white transition-all duration-200 hover:bg-white/20 hover:text-white"
    >
      {children}
    </Link>
  );
}

export function SecurityStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        PCI-DSS Level 1
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
          <Link
            to="/contact"
            className="underline underline-offset-4"
          >
            Contact us
          </Link>

          <span>Phone: +91 8112377491</span>

          <span>Email: checkemsupport@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}