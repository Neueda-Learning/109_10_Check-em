import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { OrderSummary } from "@/components/order-summary";
import { Button } from "@/components/ui/button";
import { useDraft } from "@/hooks/use-draft";
import { CHARITIES, fmt } from "@/lib/gateway";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pay/charity")({
  head: () => ({
    meta: [
      { title: "Round up for charity — NovaPay" },
      {
        name: "description",
        content:
          "Add a small optional donation to your payment. 100% of the round-up is passed on to the cause you pick.",
      },
      { property: "og:title", content: "Round up for charity — NovaPay" },
      {
        property: "og:description",
        content: "Add an optional donation to your payment at checkout.",
      },
    ],
  }),
  component: CharityStep,
});

const AMOUNTS = [0, 10, 25, 50, 100];

function CharityStep() {
  const navigate = useNavigate();
  const { draft, patch } = useDraft();
  if (!draft) return null;

  return (
    <CheckoutShell
      step="charity"
      title="Round up for a cause?"
      subtitle="Completely optional. The donation rides along on the same authorization, so there is no second charge on your statement."
      aside={<OrderSummary draft={draft} />}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-semibold">Add to your payment</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() =>
                  patch({
                    charityInr: a,
                    charityCause: a === 0 ? null : (draft.charityCause ?? CHARITIES[0]!.name),
                  })
                }
                className={cn(
                  "mono rounded-lg border px-4 py-2 text-sm transition-colors",
                  draft.charityInr === a
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                {a === 0 ? "No thanks" : fmt(a, draft.currency)}
              </button>
            ))}
          </div>

          {draft.charityInr > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold">Choose a cause</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {CHARITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patch({ charityCause: c.name })}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      draft.charityCause === c.name
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        draft.charityCause === c.name ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="mt-2 block text-sm font-semibold">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{c.blurb}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Donations are remitted monthly to the registered trust. A receipt is emailed with
                your payment receipt.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/pay/method" })}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={() => navigate({ to: "/pay/verify" })}>
            Continue to verification <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CheckoutShell>
  );
}
