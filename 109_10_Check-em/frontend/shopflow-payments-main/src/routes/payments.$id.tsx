import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { SiteFooter, SiteHeader, SecurityStrip } from "@/components/site-header";
import { StatusBadge, Timeline, type TimelineEntry } from "@/components/payment-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchPaymentById,
  fetchPaymentConversion,
  fetchPaymentHistory,
  fetchPaymentReversals,
  fetchPaymentRoute,
  fmt,
  updateBackendPaymentDescription,
  type ApiBankRoute,
  type ApiConversion,
  type ApiPayment,
  type ApiPaymentHistory,
  type ApiReversal,
  type Currency,
} from "@/lib/gateway";

export const Route = createFileRoute("/payments/$id")({
  component: PaymentDetail,
});

function PaymentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [route, setRoute] = useState<ApiBankRoute | null>(null);
  const [conversion, setConversion] = useState<ApiConversion | null>(null);
  const [reversals, setReversals] = useState<ApiReversal[]>([]);
  const [history, setHistory] = useState<ApiPaymentHistory[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const paymentId = Number(id);
    Promise.all([
      fetchPaymentById(paymentId),
      fetchPaymentHistory(paymentId),
      fetchPaymentRoute(paymentId).catch(() => null),
      fetchPaymentConversion(paymentId).catch(() => null),
      fetchPaymentReversals(paymentId).catch(() => []),
    ])
      .then(([p, h, r, c, rv]) => {
        setPayment(p);
        setHistory(h);
        setRoute(r);
        setConversion(c);
        setReversals(rv);
        setDescription(p.description ?? "");
      })
      .catch(() => navigate({ to: "/payments" }));
  }, [id, navigate]);

  const timeline = useMemo<TimelineEntry[]>(
    () =>
      history.map((h) => ({
        code: h.newStatus,
        label: h.newStatus,
        detail: h.reason || "Status updated",
        at: h.changedAt,
        state: h.newStatus === "FAILED" ? "error" : "done",
      })),
    [history],
  );

  if (!payment) return null;

  const saveDescription = async () => {
    try {
      const updated = await updateBackendPaymentDescription(payment.id, description);
      setPayment(updated);
      toast.success("Payment notes updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update payment");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/payments">
            <ArrowLeft className="h-4 w-4" /> All payments
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mono text-xs text-muted-foreground">#{payment.id}</p>
            <h1 className="mt-1 text-3xl font-bold">
              {fmt(payment.amount, payment.currency as Currency)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {payment.customer?.name} - {payment.merchant?.businessName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={payment.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-xs shadow-card">
            <Row label="Idempotency key" value={payment.idempotencyKey} />
            <Row label="Method" value={payment.paymentMethod} />
            <Row label="Currency" value={payment.currency} />
            <Row label="Status" value={payment.status} />
            {route && (
              <Row
                label="Route"
                value={`${route.merchantBankCode ?? "-"} -> ${route.selectedBankCode}`}
              />
            )}
            {conversion && (
              <Row
                label="Conversion"
                value={`${conversion.sourceCurrency} ${conversion.sourceAmount} -> ${conversion.targetCurrency} ${conversion.convertedAmount}`}
              />
            )}
            <div className="border-t border-border pt-3">
              <p className="mb-1 text-muted-foreground">Payment Note</p>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button className="mt-2 w-full" size="sm" onClick={saveDescription}>
                Save Note
              </Button>
            </div>
            {reversals.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="mb-1 text-muted-foreground">Reversals</p>
                {reversals.map((r) => (
                  <p key={r.id} className="mono text-[11px]">
                    #{r.id} {r.reversalStatus}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Event trail
            </h2>
            <Timeline entries={timeline} />
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
      </main>
      <SiteFooter />
    </div>
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
