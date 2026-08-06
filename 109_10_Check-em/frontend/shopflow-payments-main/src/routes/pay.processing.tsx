import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CheckoutShell } from "@/components/checkout-shell";
import { OrderSummary } from "@/components/order-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDraft } from "@/hooks/use-draft";
import {
  fetchPaymentBalanceCheck,
  processBackendPayment,
  type ApiPayment,
} from "@/lib/gateway";

export const Route = createFileRoute("/pay/processing")({
  validateSearch: (search: Record<string, unknown>) => ({ id: String(search["id"] ?? "") }),
  component: ProcessingStep,
});

function ProcessingStep() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { draft } = useDraft();
  const [cardPin, setCardPin] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [phase, setPhase] = useState<"bank-auth" | "portal-redirect">("bank-auth");
  const method = draft?.method ?? "card";

  const cleanedId = id.replace(/["']/g, "").trim();
  const paymentId = Number(cleanedId);

  const canSubmit = useMemo(() => {
    return cardPin.length === 4 && (otp === "121212" || otp === "242424");
  }, [cardPin, otp]);

  if (!draft) {
    return (
      <CheckoutShell
        step="processing"
        title="Bank Authentication"
        subtitle="Preparing your bank session..."
        aside={null}
      >
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold">Loading checkout state...</p>
        </div>
      </CheckoutShell>
    );
  }

  const bankName = bankNames[draft.customerBankCode] ?? draft.customerBankCode;

  if (!Number.isFinite(paymentId) || paymentId <= 0) {
    return (
      <CheckoutShell
        step="processing"
        title="Bank Authentication"
        subtitle="We could not read the payment reference."
        aside={<OrderSummary draft={draft} />}
      >
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Invalid payment reference in the processing URL.
        </div>
        <Button className="mt-4" onClick={() => navigate({ to: "/gateway" })}>
          Go home
        </Button>
      </CheckoutShell>
    );
  }

  const verifyAndProcess = async () => {
    if (!paymentId || Number.isNaN(paymentId)) return;
    setSubmitting(true);
    setStatusText("");

    try {
      setStatusText("PIN AND OTP VERIFIED");

      const balanceCheck = await fetchPaymentBalanceCheck(paymentId);
      const sufficientFunds = balanceCheck.sufficientFunds;

      const result = await processBackendPayment({
        paymentId,
        customerBankCode: draft.customerBankCode,
        simulateHighTraffic: false,
        simulateInsufficientFunds: !sufficientFunds,
        simulateNetworkError: false,
      });
      setPayment(result);

      if (sufficientFunds && result.status === "SUCCESS") {
        setStatusText("PAYMENT SUCCESSFUL");
      } else {
        setStatusText("PAYMENT UNSUCCESSFUL DUE TO INSUFFICIENT FUNDS");
      }

      window.setTimeout(() => {
        setPhase("portal-redirect");
      }, 900);

      window.setTimeout(() => {
        navigate({ to: "/pay/receipt/$id", params: { id: String(paymentId) } });
      }, 1800);
    } catch {
      setStatusText("PAYMENT UNSUCCESSFUL DUE TO INSUFFICIENT FUNDS");
      window.setTimeout(() => {
        navigate({ to: "/pay/receipt/$id", params: { id: String(paymentId) } });
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CheckoutShell
      step="processing"
      title="Bank Authentication"
      subtitle="You are now on your bank's verification page."
      aside={<OrderSummary draft={draft} />}
    >
      <div className="space-y-6">
        {phase === "portal-redirect" ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <p className="text-lg font-semibold">REDIRECTING TO PAYMENT PORTAL...</p>
          </div>
        ) : (
          <>
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <p className="text-lg font-semibold">Redirecting to bank's page</p>
        </div>

        <section className="rounded-2xl border border-sky-300 bg-sky-50 p-6 shadow-card">
          <p className="text-xs uppercase tracking-wider text-sky-700">Hosted Bank Page</p>
          <h2 className="mt-2 text-2xl font-bold text-sky-900">{bankName}</h2>
          <p className="mt-2 text-sm text-sky-900">Hi {draft.customer.name || "Customer"}, account verified.</p>

          <div className="mt-5 space-y-4 rounded-xl border border-sky-200 bg-white p-4">
            <h3 className="text-sm font-semibold">2-Factor Authentication</h3>
            <div className="space-y-1.5">
              <Label>Transaction PIN</Label>
              <Input
                className="mono"
                type="password"
                value={cardPin}
                onChange={(e) => setCardPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter 4-digit PIN"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enter OTP here</Label>
              <Input
                className="mono"
                type="password"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter OTP here"
              />
            </div>
            <p className="text-xs text-muted-foreground">All payment methods require both PIN and OTP for simulation.</p>

            <Button onClick={verifyAndProcess} disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authenticate and Pay"}
            </Button>
          </div>
        </section>

        {statusText && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm font-semibold">
            {statusText}
          </div>
        )}

        {payment && (
          <div
            className={`rounded-xl border p-4 ${
              payment.status === "SUCCESS"
                ? "border-success/40 bg-success/10"
                : "border-destructive/40 bg-destructive/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {payment.status === "SUCCESS" ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <p className="text-sm font-semibold">
                {payment.status === "SUCCESS" ? "Payment successful" : "Payment unsuccessful"}
              </p>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </CheckoutShell>
  );
}

const bankNames: Record<string, string> = {
  HSBC: "HSBC Bank",
  HDFC: "HDFC Bank",
  ICICI: "ICICI Bank",
  SBI: "State Bank of India",
  SIB: "South Indian Bank",
};
