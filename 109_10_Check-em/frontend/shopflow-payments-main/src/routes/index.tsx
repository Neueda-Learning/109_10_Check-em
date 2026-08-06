import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteFooter, SiteHeader, SecurityStrip } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  companyVisualsByCode,
  createMerchant,
  deleteMerchant,
  fetchDashboardMerchants,
  fmt,
  updateMerchant,
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
  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [editingMerchant, setEditingMerchant] = useState<ApiDashboardMerchant | null>(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editCurrency, setEditCurrency] = useState("INR");
  const [editAutopayEnabled, setEditAutopayEnabled] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletingMerchant, setDeletingMerchant] = useState<ApiDashboardMerchant | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [currency, setCurrency] = useState("INR");

  const loadMerchants = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchDashboardMerchants();
      setMerchants(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMerchants();
  }, []);

  const submitMerchant = async () => {
    if (businessName.trim().length < 2) {
      setAddError("Business name must be at least 2 characters.");
      return;
    }
    if (!/^[A-Za-z0-9]{3,12}$/.test(merchantCode.trim())) {
      setAddError("Merchant code must be 3-12 letters or numbers.");
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(currency.trim())) {
      setAddError("Currency must be a 3-letter code, e.g. INR.");
      return;
    }

    setAddBusy(true);
    setAddError("");
    try {
      await createMerchant({
        businessName,
        merchantCode,
        currency,
      });
      toast.success("Merchant added to dashboard.");
      setAddOpen(false);
      setBusinessName("");
      setMerchantCode("");
      setCurrency("INR");
      await loadMerchants();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to add merchant";
      setAddError(message);
      toast.error(message);
    } finally {
      setAddBusy(false);
    }
  };

  const openEdit = (merchant: ApiDashboardMerchant) => {
    setEditingMerchant(merchant);
    setEditBusinessName(merchant.businessName);
    setEditCurrency(merchant.currency || "INR");
    setEditAutopayEnabled(merchant.autopayEnabled);
    setEditError("");
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editingMerchant) return;
    if (editBusinessName.trim().length < 2) {
      setEditError("Business name must be at least 2 characters.");
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(editCurrency.trim())) {
      setEditError("Currency must be a 3-letter code, e.g. INR.");
      return;
    }

    setEditBusy(true);
    setEditError("");
    try {
      await updateMerchant({
        merchantId: editingMerchant.merchantId,
        businessName: editBusinessName,
        currency: editCurrency,
        autopayEnabled: editAutopayEnabled,
      });
      toast.success("Merchant updated.");
      setEditOpen(false);
      setEditingMerchant(null);
      await loadMerchants();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to update merchant";
      setEditError(message);
      toast.error(message);
    } finally {
      setEditBusy(false);
    }
  };

  const openDelete = (merchant: ApiDashboardMerchant) => {
    setDeletingMerchant(merchant);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMerchant) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteMerchant(deletingMerchant.merchantId);
      toast.success("Merchant deleted.");
      setDeleteOpen(false);
      setDeletingMerchant(null);
      await loadMerchants();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to delete merchant";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleteBusy(false);
    }
  };

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
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add merchant</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Merchant</DialogTitle>
                  <DialogDescription>
                    Enter merchant details to add a new company card to this dashboard.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="businessName">Business name</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Example Retail Pvt Ltd"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="merchantCode">Merchant code</Label>
                    <Input
                      id="merchantCode"
                      value={merchantCode}
                      onChange={(e) => setMerchantCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      placeholder="INR"
                    />
                  </div>
                  {addError && <p className="text-xs text-destructive">{addError}</p>}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addBusy}>
                    Cancel
                  </Button>
                  <Button onClick={submitMerchant} disabled={addBusy}>
                    {addBusy ? "Adding..." : "Add merchant"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              Ensure backend is running on http://10.9.78.23:8081, then refresh this page.
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
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => openEdit(merchant)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" onClick={() => openDelete(merchant)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog
          open={editOpen}
          onOpenChange={(next) => {
            setEditOpen(next);
            if (!next) {
              setEditingMerchant(null);
              setEditError("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Merchant</DialogTitle>
              <DialogDescription>
                Update company details for{" "}
                {editingMerchant?.merchantCode
                  ? `${editingMerchant.merchantCode}`
                  : "this merchant"}
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="editBusinessName">Business name</Label>
                <Input
                  id="editBusinessName"
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  placeholder="Example Retail Pvt Ltd"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editCurrency">Currency</Label>
                <Input
                  id="editCurrency"
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
                  placeholder="INR"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editAutopay">Autopay enabled</Label>
                <select
                  id="editAutopay"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editAutopayEnabled ? "yes" : "no"}
                  onChange={(e) => setEditAutopayEnabled(e.target.value === "yes")}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {editError && <p className="text-xs text-destructive">{editError}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editBusy}>
                Cancel
              </Button>
              <Button onClick={submitEdit} disabled={editBusy}>
                {editBusy ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteOpen}
          onOpenChange={(next) => {
            setDeleteOpen(next);
            if (!next) {
              setDeletingMerchant(null);
              setDeleteError("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Merchant</DialogTitle>
              <DialogDescription>
                This will permanently remove{" "}
                {deletingMerchant?.businessName || "the selected merchant"}. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteBusy}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>
                {deleteBusy ? "Deleting..." : "Delete merchant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
