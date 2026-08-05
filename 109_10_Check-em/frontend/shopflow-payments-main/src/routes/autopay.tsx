import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { useGatewayStore } from "@/hooks/use-gateway-store";
import {
  CURRENCIES,
  METHODS,
  fmt,
  getMandates,
  removeMandate,
  rid,
  saveMandate,
  type Currency,
  type Mandate,
  type MethodId,
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
  const mandates = useGatewayStore<Mandate[]>(getMandates, []);
  const [label, setLabel] = useState("H&M India — monthly essentials");
  const [amount, setAmount] = useState("2500");
  const [cap, setCap] = useState("5000");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [method, setMethod] = useState<MethodId>("card");
  const [frequency, setFrequency] = useState<(typeof FREQ)[number]>("monthly");

  const create = () => {
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
    const days = frequency === "weekly" ? 7 : frequency === "monthly" ? 30 : 90;
    saveMandate({
      id: rid("mndt"),
      createdAt: new Date().toISOString(),
      label: label.trim(),
      amountInr: amt,
      currency,
      method,
      frequency,
      nextRun: new Date(Date.now() + days * 864e5).toISOString(),
      active: true,
      maxInr,
    });
    toast.success("Mandate created — the customer's bank will be notified 24h before each debit.");
  };

  const toggle = (m: Mandate) => {
    saveMandate({ ...m, active: !m.active });
    toast.info(m.active ? "Mandate paused." : "Mandate resumed.");
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
            {mandates.length === 0 ? (
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
                  key={m.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{m.label}</p>
                      <p className="mono text-[11px] text-muted-foreground">{m.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {m.active ? "Active" : "Paused"}
                      </span>
                      <Switch
                        checked={m.active}
                        onCheckedChange={() => toggle(m)}
                        aria-label="Toggle mandate"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMandate(m.id)}
                        aria-label="Delete mandate"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
                    <Meta label="Debit" value={fmt(m.amountInr, m.currency)} />
                    <Meta label="Cap" value={fmt(m.maxInr, m.currency)} />
                    <Meta label="Frequency" value={m.frequency} />
                    <Meta label="Next run" value={new Date(m.nextRun).toLocaleDateString()} />
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
