import { AlertCircle, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiPayment } from "@/lib/gateway";

export type PaymentStatus = ApiPayment["status"];
export type TimelineEntry = {
  code: string;
  label: string;
  detail: string;
  at: string;
  state: "pending" | "active" | "done" | "error";
};

const STATUS_STYLE: Record<PaymentStatus, string> = {
  INITIATED: "border-border bg-secondary text-secondary-foreground",
  PENDING: "border-primary/40 bg-accent text-accent-foreground",
  SUCCESS: "border-success/40 bg-success/15 text-foreground",
  FAILED: "border-destructive/40 bg-destructive/10 text-foreground",
  REVERSED: "border-warning/50 bg-warning/15 text-foreground",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  INITIATED: "Initiated",
  PENDING: "Pending",
  SUCCESS: "Success",
  FAILED: "Failed",
  REVERSED: "Reversed",
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {entries.map((t, i) => (
        <li key={`${t.code}-${i}`} className="relative">
          <span
            className={cn(
              "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-card",
              t.state === "error"
                ? "border-destructive text-destructive"
                : "border-success text-success",
            )}
          >
            {t.state === "error" ? (
              <AlertCircle className="h-3 w-3" />
            ) : t.state === "pending" ? (
              <Circle className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">{t.label}</p>
            <span className="mono text-[10px] uppercase text-muted-foreground">{t.code}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t.detail}</p>
          <p className="mono mt-0.5 text-[10px] text-muted-foreground">
            {new Date(t.at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
