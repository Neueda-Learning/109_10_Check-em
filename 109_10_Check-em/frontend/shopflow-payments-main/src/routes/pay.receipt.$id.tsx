import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, RotateCcw, Search } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { StatusBadge, Timeline, type TimelineEntry } from "@/components/payment-timeline";
import { Button } from "@/components/ui/button";
import { downloadPaymentReceiptPdf } from "@/lib/pdf";
import {
  clearDraft,
  fetchPaymentById,
  fetchPaymentHistory,
  fmt,
  type ApiPaymentHistory,
  type ApiPayment,
  type Currency,
} from "@/lib/gateway";
import { getDraft } from "@/lib/gateway";

export const Route = createFileRoute("/pay/receipt/$id")({
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [history, setHistory] = useState<ApiPaymentHistory[]>([]);

  useEffect(() => {
    const paymentId = Number(id);
    Promise.all([fetchPaymentById(paymentId), fetchPaymentHistory(paymentId)])
      .then(([p, h]) => {
        setPayment(p);
        setHistory(h);
      })
      .catch(() => navigate({ to: "/payments" }));

    // Clear only after payment page is reached.
    getDraft();
    clearDraft();
  }, [id, navigate]);

  const timeline = useMemo<TimelineEntry[]>(
    () =>
      history.map((h) => ({
        code: h.newStatus,
        label: h.newStatus,
        detail: h.reason || "Status update",
        at: h.changedAt,
        state: h.newStatus === "FAILED" ? "error" : "done",
      })),
    [history],
  );

  if (!payment) return null;

  const ok = payment.status === "SUCCESS";

  return (
    <CheckoutShell
      step="receipt"
      title={ok ? "Payment successful" : "Payment could not be completed"}
      subtitle={
        ok
          ? "The payment has been processed and your merchant has been notified."
          : "A failure happened in simulation checks. Please retry with corrected details."
      }
      aside={
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Amount</p>
          <p className="mono mt-1 text-3xl font-bold">
            {fmt(payment.amount, payment.currency as Currency)}
          </p>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
            <Row label="Order ID" value={payment.orderId ?? "-"} />
            <Row label="Payment ID" value={String(payment.id)} />
            <Row label="Idempotency key" value={payment.idempotencyKey} />
            <Row label="Customer" value={payment.customer?.name ?? "-"} />
            <Row label="Customer email" value={payment.customer?.email ?? "-"} />
            <Row label="Customer phone" value={payment.customer?.phone ?? "-"} />
          
            <Row label="Merchant" value={payment.merchant?.businessName ?? "-"} />
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => downloadPaymentReceiptPdf(payment)}
          >
            <Download className="h-4 w-4" /> Save receipt
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div
          className={`rounded-2xl border p-6 shadow-card ${
            ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"
          }`}
        >
          <div className="flex items-start gap-3">
            {ok ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-success" />
            ) : (
              <AlertCircle className="mt-0.5 h-6 w-6 text-destructive" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-bold">
                  {ok
                    ? `${fmt(payment.amount, payment.currency as Currency)} paid`
                    : "Payment failed or reversed"}
                </p>
                <StatusBadge status={payment.status} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!ok && (
              <Button onClick={() => navigate({ to: "/gateway" })}>
                <RotateCcw className="h-4 w-4" /> Retry payment
              </Button>
            )}
            <Button variant={ok ? "default" : "outline"} asChild>
              <Link to="/payments/$id" params={{ id: String(payment.id) }}>
                <Search className="h-4 w-4" /> Track this payment
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Authorization trail
          </h2>
          <Timeline entries={timeline} />
        </div>
      </div>
    </CheckoutShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="mono truncate">{value}</span>
    </div>
  );
}
