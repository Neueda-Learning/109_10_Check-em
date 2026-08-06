import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { downloadCompanyPaymentsPdf } from "@/lib/pdf";
import {
  companyVisualsByCode,
  companyCodeToLabel,
  fetchMerchantSettings,
  fetchMerchantPayments,
  fmt,
  updateMerchantSettings,
  type ApiPayment,
  type Currency,
  type MerchantSettings,
} from "@/lib/gateway";

export const Route = createFileRoute("/company/$code")({
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const { code } = Route.useParams();
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [autopaySaving, setAutopaySaving] = useState(false);
  const [sortBy, setSortBy] = useState<"id" | "customer" | "method" | "currency" | "status" | "amount">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const statusRank: Record<string, number> = {
    INITIATED: 0,
    PENDING: 1,
    FAILED: 2,
    REVERSED: 3,
    SUCCESS: 4,
  };
  const methodRank: Record<string, number> = {
    CARD: 0,
    UPI: 1,
    BANK_TRANSFER: 2,
    WALLET: 3,
  };

  const compareText = (left: string, right: string) => left.localeCompare(right);
  const compareRank = (left: number, right: number) => left - right;

  useEffect(() => {
  setError("");
  setPaymentsLoading(true);
  setSettingsLoading(true);

  fetchMerchantPayments(code)
    .then(setPayments)
    .catch((e) => {
      setError(e instanceof Error ? e.message : "Unable to load merchant dashboard");
    })
    .finally(() => setPaymentsLoading(false));

  fetchMerchantSettings(code)
    .then(setSettings)
    .finally(() => setSettingsLoading(false));
}, [code]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? payments
      : payments.filter((p) =>
      [
        String(p.id),
        p.idempotencyKey,
        p.customer?.name ?? "",
        p.customer?.email ?? "",
        p.currency,
        p.paymentMethod,
        p.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );

    const sorted = [...list].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      if (sortBy === "amount") return compareRank(a.amount, b.amount) * direction;
      if (sortBy === "id") return compareRank(a.id, b.id) * direction;
      if (sortBy === "customer") {
        return compareText(a.customer?.name ?? "", b.customer?.name ?? "") * direction;
      }
      if (sortBy === "currency") {
        return compareText(a.currency ?? "", b.currency ?? "") * direction;
      }
      if (sortBy === "method") {
        return compareRank(methodRank[a.paymentMethod] ?? 99, methodRank[b.paymentMethod] ?? 99) * direction;
      }
      return compareRank(statusRank[a.status] ?? 99, statusRank[b.status] ?? 99) * direction;
    });

    return sorted;
  }, [payments, query, sortBy, sortDir]);

  const companyName = companyCodeToLabel[code] ?? code;
  const companyLogo = companyVisualsByCode[code]?.logoUrl;
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const setSort = (next: typeof sortBy) => {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(next);
    setSortDir("asc");
  };

  const saveAutopay = async (enabled: boolean) => {
    if (!settings) return;
    setAutopaySaving(true);
    try {
      await updateMerchantSettings({
        merchantId: settings.merchantId,
        merchantCode: settings.merchantCode,
        businessName: settings.businessName,
        currency: settings.currency,
        preferredBankCode: settings.preferredBankCode,
        autopayEnabled: enabled,
      });
      setSettings((prev) => (prev ? { ...prev, autopayEnabled: enabled } : prev));
      toast.success(`Autopay ${enabled ? "enabled" : "disabled"} for ${companyName}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update autopay setting");
    } finally {
      setAutopaySaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-xl border border-border bg-background">
                {companyLogo ? <AvatarImage src={companyLogo} alt={`${companyName} logo`} /> : null}
                <AvatarFallback className="rounded-xl text-sm font-semibold">
                  {companyName
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{companyName} Dashboard</h1>
                <p className="text-xs text-muted-foreground">Powered by Check 'em gateway</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              History of all payments managed via {companyName}. Track, modify, and inspect details.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadCompanyPaymentsPdf({
                  companyName,
                  companyCode: code,
                  currency: (settings?.currency ?? "INR") as Currency,
                  payments,
                })
              }
            >
              <Download className="h-4 w-4" /> Download Receipt
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card">
          <div>
            <Label className="text-sm font-semibold">Enable Autopay for this company</Label>
            <p className="text-xs text-muted-foreground">
              If turned off, checkout will not allow customers to save instruments for autopay.
            </p>
            {settingsLoading && <p className="mt-1 text-[11px] text-muted-foreground">Loading settings...</p>}
          </div>
          <Switch
            checked={Boolean(settings?.autopayEnabled)}
            disabled={!settings || settingsLoading || autopaySaving}
            onCheckedChange={saveAutopay}
            aria-label="Toggle merchant autopay"
          />
        </div>

        {!paymentsLoading && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Primary bank</p>
              <p className="mono mt-1 text-lg font-semibold">
                {settings?.preferredBankCode || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Total payments</p>
              <p className="mono mt-1 text-lg font-semibold">{payments.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="mono mt-1 text-lg font-semibold text-success">
                {payments.filter((p) => p.status === "SUCCESS").length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Processed value</p>
              <p className="mono mt-1 text-lg font-semibold">
                {fmt(totalAmount, (settings?.currency ?? "INR") as Currency)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by payment ID, customer, email, method or status"
            />
          </div>
        </div>

        {paymentsLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payments...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-medium">Unable to load merchant dashboard data.</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <SortHeader label="Payment" active={sortBy === "id"} dir={sortDir} onClick={() => setSort("id")} />
                  <SortHeader label="Customer" active={sortBy === "customer"} dir={sortDir} onClick={() => setSort("customer")} />
                  <SortHeader label="Mode" active={sortBy === "method"} dir={sortDir} onClick={() => setSort("method")} />
                  <SortHeader label="Currency" active={sortBy === "currency"} dir={sortDir} onClick={() => setSort("currency")} />
                  <SortHeader label="Status" active={sortBy === "status"} dir={sortDir} onClick={() => setSort("status")} />
                  <SortHeader label="Amount" active={sortBy === "amount"} dir={sortDir} onClick={() => setSort("amount")} alignRight />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, index) => (
                  <tr
                    key={p.id}
                    className={`border-t border-border transition-colors hover:bg-secondary/70 ${rowShadeClasses[index % rowShadeClasses.length]}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/payments/$id"
                        params={{ id: String(p.id) }}
                        className="mono font-medium text-primary underline"
                      >
                        #{p.id}
                      </Link>
                      <p className="mono text-[11px] text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{p.customer?.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3">{p.paymentMethod}</td>
                    <td className="px-4 py-3">{p.currency}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border bg-secondary px-2 py-1 text-[11px] font-medium">
                        {p.status}
                      </span>
                    </td>
                    <td className="mono px-4 py-3 text-right">
                      {fmt(p.amount, p.currency as Currency)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No payments found for this company.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  alignRight,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  alignRight?: boolean;
}) {
  return (
    <th className={`px-4 py-3 ${alignRight ? "text-right" : ""}`}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 ${alignRight ? "ml-auto" : ""}`}
        onClick={onClick}
      >
        <span>{label}</span>
        {active ? dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
      </button>
    </th>
  );
}

const rowShadeClasses = ["bg-sky-50/70", "bg-emerald-50/70", "bg-amber-50/70", "bg-rose-50/70"];
