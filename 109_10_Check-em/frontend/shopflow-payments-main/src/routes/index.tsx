import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Loader2, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteHeader, SecurityStrip } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  companyVisualsByCode,
  fetchDashboardMerchants,
  fmt,
  type ApiDashboardMerchant,
  type Currency,
} from "@/lib/gateway";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Check 'em - Company Dashboard" },
      {
        name: "description",
        content:
          "Check 'em gateway command center with featured companies, merchant dashboards, settings and payment controls.",
      },
      { property: "og:title", content: "Check 'em - Company Dashboard" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [merchants, setMerchants] = useState<ApiDashboardMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardMerchants()
      .then(setMerchants)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load companies"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-lift">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Check 'em Payment Gateway
          </p>
          <h1 className="mt-2 text-3xl font-bold">Company Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Open a company like H&M, Indigo or Hilton to view primary bank routing, payment history,
            transaction details and merchant settings. PIN for all companies is 0000.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/gateway">Open Checkout Simulator</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/payments">All payments view</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading companies...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" /> Unable to load featured companies
            </p>
            <p className="mt-1 text-xs">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ensure backend is running on http://localhost:8080, then refresh this page.
            </p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No featured companies were returned by the backend.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {merchants.map((merchant) => {
              const visual = companyVisualsByCode[merchant.merchantCode];
              const label = merchant.displayName || visual?.name || merchant.businessName;
              const logoUrl = merchant.logoUrl || visual?.logoUrl;
              return (
                <div
                  key={merchant.merchantId}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <Avatar className="h-10 w-10 rounded-xl border border-border bg-background">
                      {logoUrl ? <AvatarImage src={logoUrl} alt={`${label} logo`} /> : null}
                      <AvatarFallback className="rounded-xl text-xs font-semibold">
                        {label
                          .split(" ")
                          .map((chunk) => chunk[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="mono text-xs text-muted-foreground">
                      {merchant.merchantCode}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{label}</h2>
                  <p className="text-xs text-muted-foreground">{merchant.businessName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Primary bank: {merchant.primaryBankCode || "N/A"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border/70 bg-secondary/55 p-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Payments</p>
                      <p className="mono font-semibold">{merchant.totalPayments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success</p>
                      <p className="mono font-semibold text-success">{merchant.successPayments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="mono font-semibold text-warning-foreground">
                        {merchant.pendingPayments}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Volume</p>
                      <p className="mono font-semibold">
                        {fmt(merchant.totalProcessedAmount, merchant.currency as Currency)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    <Button asChild>
                      <Link to="/company/$code/login" params={{ code: merchant.merchantCode }}>
                        Open dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link
                        to="/gateway"
                        search={{ merchantCode: merchant.merchantCode, merchantName: label }}
                      >
                        <CreditCard className="h-4 w-4" /> Gateway checkout
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to="/company/$code/settings" params={{ code: merchant.merchantCode }}>
                        <Settings2 className="h-4 w-4" /> Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
      </main>
    </div>
  );
}
