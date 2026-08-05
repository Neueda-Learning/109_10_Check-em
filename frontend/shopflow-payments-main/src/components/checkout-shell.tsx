import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteHeader, SecurityStrip } from "@/components/site-header";

export const CHECKOUT_STEPS = [
  { key: "cart", label: "Order" },
  { key: "method", label: "Method" },
  { key: "charity", label: "Give back" },
  { key: "verify", label: "2FA" },
  { key: "processing", label: "Routing" },
  { key: "receipt", label: "Receipt" },
] as const;

export type StepKey = (typeof CHECKOUT_STEPS)[number]["key"];

export function Stepper({ current }: { current: StepKey }) {
  const index = CHECKOUT_STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex w-full items-center gap-1 sm:gap-2">
      {CHECKOUT_STEPS.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "truncate text-[11px] font-medium sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span
                className={cn("hidden h-px flex-1 sm:block", done ? "bg-success" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function CheckoutShell({
  step,
  title,
  subtitle,
  children,
  aside,
}: {
  step: StepKey;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="surface-panel rounded-2xl soft-border p-4 shadow-lift sm:p-5">
          <Stepper current={step} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-1 duration-500">
              {children}
            </div>
          </section>
          {aside && <aside className="lg:sticky lg:top-24 lg:self-start">{aside}</aside>}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
      </main>
    </div>
  );
}
