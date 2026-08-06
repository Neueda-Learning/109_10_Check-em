import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CheckoutShell } from "@/components/checkout-shell";
import { OrderSummary } from "@/components/order-summary";
import { useDraft } from "@/hooks/use-draft";
import { createBackendPayment } from "@/lib/gateway";

export const Route = createFileRoute("/pay/verify")({
  component: VerifyStep,
});

function VerifyStep() {
  const navigate = useNavigate();
  const { draft } = useDraft();
  const created = useRef(false);
  const [message, setMessage] = useState("Redirecting to bank's page...");

  useEffect(() => {
    if (!draft || created.current) return;
    created.current = true;

    createBackendPayment({
      idempotencyKey: draft.idempotencyKey,
      merchantCode: draft.merchantCode,
      amount: Number((draft.amountInr + draft.charityInr + (draft.fxChargeInr ?? 0)).toFixed(2)),
      currency: draft.currency,
      paymentMethod: draft.method ?? "card",
      customerSeed: draft.customer.email,
      description: `Checkout for ${draft.merchantName}`,
    })
      .then((payment) => {
        setMessage("Redirecting to bank's page...");
        window.setTimeout(() => {
          navigate({ to: "/pay/processing", search: { id: String(payment.id) } });
        }, 1200);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Unable to create payment");
        navigate({
          to: "/gateway",
          search: { merchantCode: draft.merchantCode, merchantName: draft.merchantName },
        });
      });
  }, [draft, navigate]);

  if (!draft) return null;

  return (
    <CheckoutShell
      step="verify"
      title="Redirecting"
      subtitle="Please wait while we hand over this transaction to your bank for authentication."
      aside={<OrderSummary draft={draft} />}
    >
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-4 text-lg font-semibold">{message}</p>
      </div>
    </CheckoutShell>
  );
}
