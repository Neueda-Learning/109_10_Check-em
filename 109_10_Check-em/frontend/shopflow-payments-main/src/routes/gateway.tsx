import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ShieldCheck, Repeat, Globe2, GitBranch, AlertTriangle } from "lucide-react";

import { CheckoutShell } from "@/components/checkout-shell";
import { OrderSummary } from "@/components/order-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCIES,
  fetchMerchantSettings,
  getOrderItemsForMerchant,
  isValidE164Phone,
  isValidEmail,
  newDraft,
  saveDraft,
  type Currency,
  type Draft,
} from "@/lib/gateway";

export const Route = createFileRoute("/gateway")({
  validateSearch: (search: Record<string, unknown>) => ({
    merchantCode: String(search["merchantCode"] ?? "HM001"),
    merchantName: String(search["merchantName"] ?? "H&M"),
  }),
  head: () => ({
    meta: [
      { title: "PayFlow Gateway Checkout" },
      {
        name: "description",
        content:
          "Start a secure gateway checkout with currency selection, charity options, and bank simulation routing.",
      },
    ],
  }),
  component: CheckoutStart,
});

function CheckoutStart() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const orderItems = useMemo(
    () => getOrderItemsForMerchant(search.merchantCode),
    [search.merchantCode],
  );
  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.inr * item.qty, 0),
    [orderItems],
  );
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [draft, setDraft] = useState<Draft>(() => ({
    ...newDraft(subtotal),
    merchantCode: search.merchantCode,
    merchantName: search.merchantName,
    amountInr: subtotal,
    customer: { name: "", email: "", phone: "" },
  }));

  useEffect(() => {
    let active = true;
    setLoadingSettings(true);
    fetchMerchantSettings(search.merchantCode)
      .then((settings) => {
        if (!active) return;
        const storeCurrency = settings.currency as Currency;
        setDraft((prev) => ({
          ...prev,
          merchantCode: search.merchantCode,
          merchantName: search.merchantName,
          amountInr: subtotal,
          storeCurrency,
          currency: storeCurrency,
          autopayAllowed: settings.autopayEnabled,
          autopay: settings.autopayEnabled ? prev.autopay : false,
          subscriptionLabel: settings.autopayEnabled ? prev.subscriptionLabel : "",
          fxChargeInr: 0,
          fxConsentAccepted: false,
        }));
      })
      .catch(() => {
        if (!active) return;
        setDraft((prev) => ({
          ...prev,
          merchantCode: search.merchantCode,
          merchantName: search.merchantName,
          amountInr: subtotal,
          customer: prev.customer,
        }));
      })
      .finally(() => {
        if (active) setLoadingSettings(false);
      });
    return () => {
      active = false;
    };
  }, [search.merchantCode, search.merchantName, subtotal]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const start = () => {
    const nextErrors: { name?: string; email?: string; phone?: string } = {};
    if (draft.customer.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }
    if (!isValidEmail(draft.customer.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!isValidE164Phone(draft.customer.phone)) {
      nextErrors.phone = "Phone must be in E.164 format, e.g. +919876543210.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    saveDraft(draft);
    navigate({ to: "/pay/method" });
  };

  return (
    <CheckoutShell
      step="cart"
      title={`${draft.merchantName} Gateway Checkout`}
      subtitle="Enter your details and continue to payment mode. The backend routing and payment checks are simulated in real time."
      aside={<OrderSummary draft={draft} items={orderItems} />}
    >
      <div className="space-y-6">
        {loadingSettings && (
          <p className="text-sm text-muted-foreground">
            Loading company currency and autopay settings...
          </p>
        )}
        <div className="grid-hero rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 rounded-xl border border-primary/40 bg-accent p-3 text-sm">
            Merchant: <span className="mono font-semibold">{draft.merchantName}</span> (
            {draft.merchantCode})
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input
                value={draft.customer.name}
                onChange={(e) => patch({ customer: { ...draft.customer, name: e.target.value } })}
                placeholder="Name on the account"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </Field>
            <Field label="Email for receipt">
              <Input
                type="email"
                value={draft.customer.email}
                onChange={(e) => patch({ customer: { ...draft.customer, email: e.target.value } })}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </Field>
            <Field label="Phone number">
              <Input
                value={draft.customer.phone}
                onChange={(e) => patch({ customer: { ...draft.customer, phone: e.target.value } })}
                placeholder="+919876543210"
              />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
            </Field>
            <Field label="Pay in currency">
              <Select
                value={draft.currency}
                onValueChange={(v) =>
                  patch({
                    currency: v as Currency,
                    fxConsentAccepted: false,
                    fxChargeInr: 0,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCIES[c].symbol} {c} - {CURRENCIES[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Order reference">
              <Input readOnly value={draft.orderId} className="mono" />
            </Field>
          </div>

          {!draft.autopayAllowed && (
            <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground">
              Autopay is currently disabled for this company. You can still complete one-time
              payments.
            </div>
          )}

          <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-warning/40 bg-warning/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
              <div>
                <p className="text-sm font-semibold">Demo: simulate failure path</p>
                <p className="text-xs text-muted-foreground">
                  Turn this on to test insufficient balance/network failure and auto reversal
                  behavior.
                </p>
              </div>
            </div>
            <Switch
              checked={draft.forceFailure}
              onCheckedChange={(v) => patch({ forceFailure: v })}
              aria-label="Force a declined payment"
            />
          </div>

          <Button size="lg" className="mt-6 w-full" onClick={start}>
            Continue to payment method <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Want merchant-side controls?{" "}
            <Link to="/" className="underline">
              Open company dashboard
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Feature
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Two-factor verification"
            body="PIN and OTP checks are simulated before processing the bank call."
          />
          <Feature
            icon={<Repeat className="h-4 w-4" />}
            title="Idempotent request keys"
            body="Retrying the same key safely returns the same payment instead of double charge."
          />
          <Feature
            icon={<Globe2 className="h-4 w-4" />}
            title="Multi-currency support"
            body="Pay in INR/USD/EUR/GBP/AED, then settle using merchant preferences."
          />
          <Feature
            icon={<GitBranch className="h-4 w-4" />}
            title="Dynamic bank routing"
            body="Traffic-aware routing simulation picks a processing bank for each transaction."
          />
        </div>
      </div>
    </CheckoutShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
