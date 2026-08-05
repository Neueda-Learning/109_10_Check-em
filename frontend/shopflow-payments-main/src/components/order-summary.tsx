import { CURRENCIES, fmt, type Draft } from "@/lib/gateway";
import { Lock } from "lucide-react";

export function OrderSummary({
  draft,
  items,
}: {
  draft: Draft;
  items?: { name: string; qty: number; inr: number }[];
}) {
  const fxChargeInr = draft.fxChargeInr ?? 0;
  const total = draft.amountInr + draft.charityInr + fxChargeInr;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Order summary
        </h2>
        <span className="mono text-[11px] text-muted-foreground">{draft.orderId}</span>
      </div>

      {items && (
        <ul className="mt-4 space-y-2.5 border-b border-border pb-4 text-sm">
          {items.map((it) => (
            <li key={it.name} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {it.name} <span className="mono text-xs">×{it.qty}</span>
              </span>
              <span className="mono">{fmt(it.inr * it.qty, draft.currency)}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={fmt(draft.amountInr, draft.currency)} />
        {draft.charityInr > 0 && (
          <Row
            label={`Charity round-up${draft.charityCause ? ` · ${draft.charityCause}` : ""}`}
            value={fmt(draft.charityInr, draft.currency)}
          />
        )}
        {fxChargeInr > 0 && (
          <Row label="FX conversion & cross-border charges" value={fmt(fxChargeInr, draft.currency)} />
        )}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold">Total payable</dt>
          <dd className="mono text-xl font-bold">{fmt(total, draft.currency)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Settled in {CURRENCIES[draft.currency].label} ({draft.currency}). Merchant settlement
        currency INR.
      </p>

      {draft.currency !== "INR" && (
        <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-muted-foreground">
          You are paying in {draft.currency}. Final payable includes conversion spread,
          cross-border assessment, and processing fee once you consent.
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-[11px] text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0 text-success" />
        Card data never touches the merchant server — it is tokenised inside NovaPay's vault.
      </div>

      <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
        <div className="flex justify-between gap-2">
          <span>Idempotency key</span>
          <span className="mono truncate">{draft.idempotencyKey}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mono">{value}</dd>
    </div>
  );
}
