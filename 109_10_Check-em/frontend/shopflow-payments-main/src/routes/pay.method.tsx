import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  CalendarClock,
} from "lucide-react";

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
import { useDraft } from "@/hooks/use-draft";
import {
  formatCardNumberInput,
  isValidBankName,
  isValidCardNumber16,
  isValidE164Phone,
  isValidFutureExpiry,
  isValidUpiId,
  METHODS,
  type MethodId,
} from "@/lib/gateway";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/pay/method")({
  head: () => ({
    meta: [
      { title: "Choose a payment method — NovaPay" },
      {
        name: "description",
        content:
          "Pay by card, UPI, net banking, wallet or EMI. Every instrument is tokenised before it leaves your browser.",
      },
      { property: "og:title", content: "Choose a payment method — NovaPay" },
      {
        property: "og:description",
        content: "Card, UPI, net banking, wallet or EMI on a PCI-DSS Level 1 gateway.",
      },
    ],
  }),
  component: MethodStep,
});

const ICONS: Record<MethodId, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  upi: <Smartphone className="h-4 w-4" />,
  netbanking: <Landmark className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
  emi: <CalendarClock className="h-4 w-4" />,
};

const PLACEHOLDER: Record<MethodId, string> = {
  card: "4242 4242 4242 4242",
  upi: "aarav@oksbi",
  netbanking: "HDFC Bank",
  wallet: "+91 98765 43210",
  emi: "4242 4242 4242 4242 · 6 months",
};

function normalizeWalletPhoneInput(value: string): string {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D/g, "").slice(0, 15);
  return `${prefix}${digits}`;
}

function MethodStep() {
  const navigate = useNavigate();
  const { draft, patch } = useDraft();
  const [instrumentError, setInstrumentError] = useState<string | null>(null);
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  if (!draft) return null;

  const selected = draft.method;
  const isCardLike = selected === "card" || selected === "emi";
  const ready = Boolean(selected && draft.instrument.trim().length >= 2);

  const validateAndContinue = () => {
    if (!selected) {
      setInstrumentError("Choose a payment method to continue.");
      return;
    }

    const value = draft.instrument.trim();
    if (isCardLike && !isValidCardNumber16(value)) {
      setInstrumentError("Enter a valid 16-digit card number in XXXX XXXX XXXX XXXX format.");
      return;
    }
    if (isCardLike) {
      if (!cardHolderName.trim()) {
        setInstrumentError("Card holder name is required.");
        return;
      }
      if (!isValidFutureExpiry(cardExpiry)) {
        setInstrumentError("Expiry must be in MM/YY format and must be this month or later.");
        return;
      }
      if (!/^\d{3}$/.test(cardCvv)) {
        setInstrumentError("CVV must be exactly 3 digits.");
        return;
      }
    }
    if (selected === "upi" && !isValidUpiId(value)) {
      setInstrumentError("Enter a valid UPI ID, e.g. name@oksbi.");
      return;
    }
    if (selected === "wallet" && !isValidE164Phone(value)) {
      setInstrumentError("Wallet number must be in E.164 format, e.g. +14155550102.");
      return;
    }
    if (selected === "netbanking" && !isValidBankName(value)) {
      setInstrumentError("Enter a valid bank name.");
      return;
    }
    setInstrumentError(null);
    navigate({ to: "/pay/charity" });
  };

  return (
    <CheckoutShell
      step="method"
      title="How would you like to pay?"
      subtitle="Choose an instrument. NovaPay tokenises it instantly — the retailer only ever sees a token, never your real credentials."
      aside={<OrderSummary draft={draft} />}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => patch({ method: m.id, instrument: "" })}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                selected === m.id
                  ? "border-primary bg-accent shadow-card"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  selected === m.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {ICONS[m.id]}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.hint}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {m.needs2fa ? "2-factor required" : "No 2FA — pre-authorised balance"}
                </span>
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {selected === "upi"
                ? "UPI ID"
                : selected === "netbanking"
                  ? "Select your bank"
                  : selected === "wallet"
                    ? "Wallet mobile number"
                    : "Card number"}
            </Label>
            <Input
              className="mono mt-2"
              value={draft.instrument}
              placeholder={PLACEHOLDER[selected]}
              onChange={(e) => {
                const nextValue =
                  selected === "card" || selected === "emi"
                    ? formatCardNumberInput(e.target.value)
                    : selected === "wallet"
                      ? normalizeWalletPhoneInput(e.target.value)
                      : e.target.value;
                patch({ instrument: nextValue });
                if (instrumentError) setInstrumentError(null);
              }}
            />

            {isCardLike && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Card holder
                  </Label>
                  <Input
                    className="mt-2"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    placeholder="Aarav Sharma"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Expiry (MM/YY)
                  </Label>
                  <Input
                    className="mono mt-2"
                    value={cardExpiry}
                    onChange={(e) =>
                      setCardExpiry(
                        e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 4)
                          .replace(/(\d{2})(\d{0,2})/, (_, mm, yy) => (yy ? `${mm}/${yy}` : mm)),
                      )
                    }
                    placeholder="08/29"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    CVV
                  </Label>
                  <Input
                    className="mono mt-2"
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                  />
                </div>
              </div>
            )}
            {instrumentError && (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {instrumentError}
              </p>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              Entered inside NovaPay's PCI-DSS scoped iframe. Stored only as a network token.
            </p>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer Bank (simulation)
              </Label>
              <Select
                value={draft.customerBankCode}
                onValueChange={(value) => patch({ customerBankCode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HSBC">HSBC</SelectItem>
                  <SelectItem value="HDFC">HDFC</SelectItem>
                  <SelectItem value="ICICI">ICICI</SelectItem>
                  <SelectItem value="SBI">SBI</SelectItem>
                  <SelectItem value="SIB">SIB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4 rounded-xl bg-secondary p-4">
              <div>
                <p className="text-sm font-semibold">Save this instrument for Autopay</p>
                <p className="text-xs text-muted-foreground">
                  Creates a mandate so future orders are charged automatically, within a cap you
                  set.
                </p>
              </div>
              <Switch
                checked={draft.autopay}
                onCheckedChange={(v) => patch({ autopay: v })}
                aria-label="Enable autopay"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: "/gateway",
                search: { merchantCode: draft.merchantCode, merchantName: draft.merchantName },
              })
            }
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button disabled={!ready} onClick={validateAndContinue}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CheckoutShell>
  );
}
