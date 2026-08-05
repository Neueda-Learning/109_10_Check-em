import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, GitBranch, Landmark, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CheckoutShell } from "@/components/checkout-shell";
import { OrderSummary } from "@/components/order-summary";
import { useDraft } from "@/hooks/use-draft";
import {
  fetchPaymentRoute,
  processBackendPayment,
  type ApiBankRoute,
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
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [route, setRoute] = useState<ApiBankRoute | null>(null);
  const [message, setMessage] = useState("Starting transaction...");
  const [stage, setStage] = useState<"redirecting" | "bank" | "returning">("redirecting");

  useEffect(() => {
    if (!draft) return;
    if (!id) {
      navigate({
        to: "/gateway",
        search: { merchantCode: draft.merchantCode, merchantName: draft.merchantName },
      });
      return;
    }

    const paymentId = Number(id);
    const bankName = bankNames[draft.customerBankCode] ?? draft.customerBankCode;
    const run = async () => {
      setStage("redirecting");
      setMessage("Redirecting to your bank's secure authorisation page...");
      await pause(900);

      setStage("bank");
      setMessage(`Authorising payment with ${bankName}...`);
      await pause(1400);

      const result = await processBackendPayment({
        paymentId,
        customerBankCode: draft.customerBankCode,
        simulateHighTraffic: draft.forceFailure,
        simulateInsufficientFunds: draft.forceFailure,
        simulateNetworkError: false,
      });
      setPayment(result);
      try {
        const routeData = await fetchPaymentRoute(paymentId);
        setRoute(routeData);
      } catch {
        setRoute(null);
      }

      setStage("returning");
      setMessage(
        result.status === "SUCCESS"
          ? "Bank approved the payment. Returning to merchant..."
          : "Bank declined the payment. Returning to merchant...",
      );
      setTimeout(
        () => navigate({ to: "/pay/receipt/$id", params: { id: String(paymentId) } }),
        1400,
      );
    };

    run().catch(() => {
      setMessage("Payment processing failed unexpectedly. Returning to gateway...");
      setTimeout(
        () =>
          navigate({
            to: "/gateway",
            search: { merchantCode: draft.merchantCode, merchantName: draft.merchantName },
          }),
        1400,
      );
    });
  }, [draft, id, navigate]);

  if (!draft) return null;

  const bankName = bankNames[draft.customerBankCode] ?? draft.customerBankCode;

  return (
    <CheckoutShell
      step="processing"
      title="Gateway Processing"
      subtitle="The gateway is now routing this payment through bank simulation checks."
      aside={<OrderSummary draft={draft} />}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {stage === "bank" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{bankName} Secure Authorisation</p>
                    <p className="text-xs text-muted-foreground">
                      Verifying funds, 3DS status, and issuer rules for this transaction.
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-border bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                  Hosted bank page
                </span>
              </div>

              <div className="rounded-xl border border-primary/30 bg-accent p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current action</p>
                <div className="mt-2 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm font-semibold">{message}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
                <div className="rounded-lg border border-border p-3">Cardholder authentication</div>
                <div className="rounded-lg border border-border p-3">Issuer balance verification</div>
                <div className="rounded-lg border border-border p-3">Acquirer risk and routing checks</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm font-semibold">{message}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stage === "redirecting"
                  ? "Handing off from merchant checkout to the simulated bank portal."
                  : "Returning from the bank with the final authorization result."}
              </p>
            </>
          )}
        </div>

        {route && (
          <div className="rounded-2xl border border-primary/40 bg-accent p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Route</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[11px]">
                <GitBranch className="h-3.5 w-3.5" /> {route.routingType}
              </span>
            </div>
            <p className="mt-2 text-sm">
              {route.merchantBankCode ?? "Merchant Bank"} {" -> "}{" "}
              {route.customerBankCode ?? "Customer Bank"} via {route.selectedBankCode}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {route.reason ?? "Dynamic route selected by backend"}
            </p>
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
                {payment.status === "SUCCESS" ? "Payment successful" : "Payment did not complete"}
              </p>
            </div>
          </div>
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

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
