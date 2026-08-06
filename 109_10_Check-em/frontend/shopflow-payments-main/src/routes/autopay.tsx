import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteHeader, SecurityStrip } from "@/components/site-header";
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
  METHODS,
  createBackendMandate,
  deleteBackendMandate,
  fetchBackendMandates,
  formatCardNumberInput,
  normalizeCardNumber,
  updateBackendMandateStatus,
  isValidCardNumber,
  isValidE164Phone,
  isValidUpiId,
  type Currency,
  type MethodId,
  type ApiMandate,
} from "@/lib/gateway";

export const Route = createFileRoute("/autopay")({
  head: () => ({
    meta: [
      { title: "Autopay mandates — NovaPay" },
      {
        name: "description",
        content:
          "Create and manage recurring payment mandates with spend caps, pause controls and a fixed debit schedule.",
      },
      { property: "og:title", content: "Autopay mandates — NovaPay" },
      {
        property: "og:description",
        content: "Recurring mandates with spend caps and pause controls.",
      },
    ],
  }),
  component: AutopayPage,
});

const FREQ = ["weekly", "monthly", "quarterly"] as const;

function AutopayPage() {
  const [mandates, setMandates] = useState<ApiMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantCode, setMerchantCode] = useState("HM001");
  const [label, setLabel] = useState("H&M India — monthly essentials");
  const [amount, setAmount] = useState("2500");
  const [cap, setCap] = useState("5000");
  const [otp, setOtp] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [method, setMethod] = useState<MethodId>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [walletPhone, setWalletPhone] = useState("");
  const [frequency, setFrequency] = useState<(typeof FREQ)[number]>("monthly");

  const normalizedMerchantCode = useMemo(() => merchantCode.trim().toUpperCase(), [merchantCode]);

  const loadMandates = async () => {
    try {
      setLoading(true);
      const data = await fetchBackendMandates(normalizedMerchantCode);
      setMandates(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to fetch mandates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMandates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedMerchantCode]);

  const create = async () => {
    const amt = Number(amount);
    const maxInr = Number(cap);
    if (!label.trim() || !amt || amt <= 0) {
      toast.error("Give the mandate a name and a positive amount.");
      return;
    }
    if (maxInr < amt) {
      toast.error("The spend cap must be at least the debit amount.");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP to create mandate.");
      return;
    }

    if (method === "card") {
      if (!isValidCardNumber(cardNumber)) {
        toast.error("Enter a valid card number.");
        return;
      }
      if (!cardHolderName.trim()) {
        toast.error("Card holder name is required.");
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
        toast.error("Card expiry must be MM/YY.");
        return;
      }
    }

    if (method === "upi" && !isValidUpiId(upiId)) {
      toast.error("Enter a valid UPI ID (example: name@oksbi)");
      return;
    }

    if (method === "wallet" && !isValidE164Phone(walletPhone)) {
      toast.error("Wallet phone must be in E.164 format (example: +14155550102)");
      return;
    }

    try {
      await createBackendMandate({
        label: label.trim(),
        merchantCode: normalizedMerchantCode,
        customerId: 2,
        paymentMethod:
          method === "netbanking"
            ? "NET_BANKING"
            : method === "emi"
              ? "CARD"
              : (method.toUpperCase() as "CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "WALLET"),
        otp,
        cardNumber: normalizeCardNumber(cardNumber),
        cardHolderName: cardHolderName.trim(),
        cardExpiry,
        upiId: upiId.trim(),
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        walletPhone: walletPhone.trim(),
        debitAmount: amt,
        maxAmount: maxInr,
        currency,
        frequency: frequency.toUpperCase() as "WEEKLY" | "MONTHLY" | "QUARTERLY",
      });
      toast.success("Mandate created and OTP verified.");
      setOtp("");
      await loadMandates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to create mandate");
    }
  };

  const toggle = async (m: ApiMandate) => {
    if (otp.length !== 6) {
      toast.error("Enter OTP to pause or resume a mandate.");
      return;
    }
    try {
      await updateBackendMandateStatus({
        mandateId: m.id,
        status: m.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
        otp,
      });
      toast.info(m.status === "ACTIVE" ? "Mandate paused." : "Mandate resumed.");
      setOtp("");
      await loadMandates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update mandate status");
    }
  };

  const deleteMandate = async (id: number) => {
    if (otp.length !== 6) {
      toast.error("Enter OTP to delete a mandate.");
      return;
    }
    try {
      await deleteBackendMandate(id, otp);
      toast.success("Mandate deleted.");
      setOtp("");
      await loadMandates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete mandate");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Autopay</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Standing instructions on a tokenised instrument. Every mandate has a hard spend cap, a
          fixed schedule and can be paused instantly — the customer stays in control.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              New mandate
            </h2>
            <div className="mt-4 space-y-4">
              <Field label="Mandate name">
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </Field>
              <Field label="Merchant code">
                <Input
                  value={merchantCode}
                  onChange={(e) => setMerchantCode(e.target.value.toUpperCase())}
                  placeholder="HM001"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Debit amount (₹)">
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </Field>
                <Field label="Spend cap (₹)">
                  <Input type="number" value={cap} onChange={(e) => setCap(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency">
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Frequency">
                  <Select
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as (typeof FREQ)[number])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQ.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Instrument">
                <Select value={method} onValueChange={(v) => setMethod(v as MethodId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {method === "card" && (
                <>
                  <Field label="Card number">
                    <Input
                      className="mono"
                      value={cardNumber}
                      placeholder="4242 4242 4242 4242"
                      onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Card holder name">
                      <Input
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="Aarav Sharma"
                      />
                    </Field>
                    <Field label="Expiry (MM/YY)">
                      <Input
                        className="mono"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value.replace(/[^0-9/]/g, "").slice(0, 5))}
                        placeholder="08/29"
                      />
                    </Field>
                  </div>
                </>
              )}

              {method === "upi" && (
                <Field label="UPI ID">
                  <Input
                    className="mono"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@oksbi"
                  />
                </Field>
              )}

              {(method === "netbanking" || method === "emi") && (
                <>
                  <Field label="Bank name">
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Account number">
                      <Input
                        className="mono"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                      />
                    </Field>
                    <Field label="IFSC">
                      <Input
                        className="mono"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="HDFC0001234"
                      />
                    </Field>
                  </div>
                </>
              )}

              {method === "wallet" && (
                <Field label="Wallet phone (E.164)">
                  <Input
                    className="mono"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    placeholder="+14155550102"
                  />
                </Field>
              )}

              <Field label="OTP verification (Demo: 123456)">
                <Input
                  className="mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="123456"
                />
              </Field>

              <Button className="w-full" onClick={create}>
                <Plus className="h-4 w-4" /> Create mandate
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Mandates are registered with the issuing bank under the e-mandate framework. A 2FA
                step-up is required only at registration, not on each debit.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Loading mandates...</p>
              </div>
            ) : mandates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <CalendarClock className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">No mandates yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create one here, or tick “Save this instrument for Autopay” during checkout.
                </p>
                <Button variant="outline" className="mt-5" asChild>
                  <Link to="/gateway">Go to checkout</Link>
                </Button>
              </div>
            ) : (
              mandates.map((m) => (
                <div
                  key={String(m.id)}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{m.label}</p>
                      <p className="mono text-[11px] text-muted-foreground">MNDT-{m.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {m.status === "ACTIVE" ? "Active" : "Paused"}
                      </span>
                      <Switch
                        checked={m.status === "ACTIVE"}
                        onCheckedChange={() => toggle(m)}
                        aria-label="Toggle mandate"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMandate(m.id)}
                        aria-label="Delete mandate"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
                    <Meta label="Debit" value={`${m.currency} ${m.debitAmount.toFixed(2)}`} />
                    <Meta label="Cap" value={`${m.currency} ${m.maxAmount.toFixed(2)}`} />
                    <Meta label="Frequency" value={m.frequency.toLowerCase()} />
                    <Meta label="Updated" value={new Date(m.updatedAt).toLocaleDateString()} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
      </main>
    </div>
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mono mt-0.5 font-medium capitalize">{value}</p>
    </div>
  );
}
