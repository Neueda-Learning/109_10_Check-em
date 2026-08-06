import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search, SlidersHorizontal } from "lucide-react";

import { SiteFooter, SiteHeader, SecurityStrip } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  companyCodeToLabel,
  fetchMerchantPayments,
  fetchMerchants,
  fmt,
  type ApiPayment,
  type Currency,
} from "@/lib/gateway";

export const Route = createFileRoute("/payments/")({
  component: PaymentsList,
});

const STATUSES = ["all", "INITIATED", "PENDING", "SUCCESS", "FAILED", "REVERSED"] as const;

function PaymentsList() {
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [company, setCompany] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"id" | "company" | "customer" | "status" | "amount">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const statusRank: Record<string, number> = {
    INITIATED: 0,
    PENDING: 1,
    FAILED: 2,
    REVERSED: 3,
    SUCCESS: 4,
  };

  const compareText = (left: string, right: string) => left.localeCompare(right);
  const compareRank = (left: number, right: number) => left - right;

  useEffect(() => {
    async function load() {
      const merchants = await fetchMerchants();
      const lists = await Promise.all(merchants.map((m) => fetchMerchantPayments(m.merchantCode)));
      setPayments(lists.flat());
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, []);

  const companies = useMemo(() => {
    const set = new Set(payments.map((p) => p.merchant?.merchantCode));
    return Array.from(set).filter(Boolean) as string[];
  }, [payments]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = payments.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (method !== "all" && p.paymentMethod !== method) return false;
      if (company !== "all" && p.merchant?.merchantCode !== company) return false;
      if (!needle) return true;
      return [
        String(p.id),
        p.idempotencyKey,
        p.customer?.name ?? "",
        p.customer?.email ?? "",
        p.currency,
        p.paymentMethod,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    return [...list].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      if (sortBy === "amount") return compareRank(a.amount, b.amount) * direction;
      if (sortBy === "id") return compareRank(a.id, b.id) * direction;
      if (sortBy === "company") {
        return compareText(
          companyCodeToLabel[a.merchant?.merchantCode ?? ""] ?? a.merchant?.merchantCode ?? "",
          companyCodeToLabel[b.merchant?.merchantCode ?? ""] ?? b.merchant?.merchantCode ?? "",
        ) * direction;
      }
      if (sortBy === "customer") {
        return compareText(a.customer?.name ?? "", b.customer?.name ?? "") * direction;
      }
      return compareRank(statusRank[a.status] ?? 99, statusRank[b.status] ?? 99) * direction;
    });
  }, [payments, q, status, method, company, sortBy, sortDir]);

  const setSort = (next: typeof sortBy) => {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(next);
    setSortDir("asc");
  };

  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gateway-wide transaction history from backend APIs.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Transactions" value={String(payments.length)} />
          <Stat label="Total Volume" value={fmt(totalVolume, "INR")} />
          <Stat label="Success" value={`${successCount}`} />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Search & filter
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Payment ID, key, customer, method"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {companyCodeToLabel[code] ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="CARD">CARD</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="BANK_TRANSFER">BANK_TRANSFER</SelectItem>
                <SelectItem value="WALLET">WALLET</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold">No payments found</p>
              <Button className="mt-5" asChild>
                <Link to="/gateway">Start checkout</Link>
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <SortHeader label="Payment" active={sortBy === "id"} dir={sortDir} onClick={() => setSort("id")} />
                  <SortHeader label="Company" active={sortBy === "company"} dir={sortDir} onClick={() => setSort("company")} />
                  <SortHeader label="Customer" active={sortBy === "customer"} dir={sortDir} onClick={() => setSort("customer")} className="hidden sm:table-cell" />
                  <SortHeader label="Status" active={sortBy === "status"} dir={sortDir} onClick={() => setSort("status")} />
                  <SortHeader label="Amount" active={sortBy === "amount"} dir={sortDir} onClick={() => setSort("amount")} alignRight />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/60">
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
                      {companyCodeToLabel[p.merchant?.merchantCode ?? ""] ??
                        p.merchant?.businessName}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <p>{p.customer?.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="mono px-4 py-3 text-right font-medium">
                      {fmt(p.amount, p.currency as Currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
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
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  alignRight?: boolean;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 ${alignRight ? "text-right" : ""} ${className ?? ""}`.trim()}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mono mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
