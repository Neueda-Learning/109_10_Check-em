import { CURRENCIES, fmt, getOrderItemsForMerchant, type Draft } from "@/lib/gateway";
import { Lock } from "lucide-react";

export function OrderSummary({
  draft,
  items,
}: {
  draft: Draft;
  items?: { name: string; qty: number; inr: number }[];
}) {
  const summaryItems = items ?? getOrderItemsForMerchant(draft.merchantCode);
  const hasCurrencyChange = draft.currency !== draft.storeCurrency;
  const fxChargeInr = hasCurrencyChange ? draft.fxChargeInr ?? 0 : 0;
  const total = draft.amountInr + draft.charityInr + fxChargeInr;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Order summary
        </h2>
        <span className="mono text-[11px] text-muted-foreground">{draft.orderId}</span>
      </div>

      {summaryItems && (
        <ul className="mt-4 space-y-2.5 border-b border-border pb-4 text-sm">
          {summaryItems.map((it) => (
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
          <Row
            label="Conversion charges + transfer fee"
            value={fmt(fxChargeInr, draft.currency)}
            valueClassName="text-destructive"
          />
        )}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold">Total payable</dt>
          <dd className="mono text-xl font-bold">{fmt(total, draft.currency)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Store default currency: {CURRENCIES[draft.storeCurrency].label} ({draft.storeCurrency}).
      </p>

      {hasCurrencyChange && (
        <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-muted-foreground">
          Paying in {draft.currency} instead of {draft.storeCurrency}. Extra conversion charges are
          shown above in red, and total payable is updated accordingly.
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

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`mono ${valueClassName ?? ""}`.trim()}>{value}</dd>
    </div>
  );
}
