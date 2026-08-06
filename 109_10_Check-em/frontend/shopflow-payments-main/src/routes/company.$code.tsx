import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Search, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearCompanyAuth, isCompanyAuthenticated } from "@/lib/company-session";
import {
  companyVisualsByCode,
  companyCodeToLabel,
  fetchMerchantSettings,
  fetchMerchantPayments,
  fmt,
  type ApiPayment,
  type Currency,
  type MerchantSettings,
} from "@/lib/gateway";

export const Route = createFileRoute("/company/$code")({
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isCompanyAuthenticated(code)) {
      navigate({ to: "/company/$code/login", params: { code } });
      return;
    }
    Promise.all([fetchMerchantPayments(code), fetchMerchantSettings(code)])
      .then(([merchantPayments, merchantSettings]) => {
        setPayments(merchantPayments);
        setSettings(merchantSettings);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load merchant dashboard"))
      .finally(() => setLoading(false));
  }, [code, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
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
  }, [payments, query]);

  const companyName = companyCodeToLabel[code] ?? code;
  const companyLogo = companyVisualsByCode[code]?.logoUrl;
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

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
            <Button variant="outline" asChild>
              <Link to="/company/$code/settings" params={{ code }}>
                <Settings2 className="h-4 w-4" /> Settings
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearCompanyAuth(code);
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        {!loading && (
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

        {loading ? (
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
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/50">
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
    </div>
  );
}
