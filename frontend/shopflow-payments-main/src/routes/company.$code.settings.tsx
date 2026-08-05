import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isCompanyAuthenticated } from "@/lib/company-session";
import {
  companyCodeToLabel,
  CURRENCIES,
  fetchMerchantSettings,
  fetchRoutingBanks,
  updateMerchantSettings,
  type ApiBankNode,
  type MerchantSettings,
} from "@/lib/gateway";

export const Route = createFileRoute("/company/$code/settings")({
  component: CompanySettings,
});

function CompanySettings() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [banks, setBanks] = useState<ApiBankNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isCompanyAuthenticated(code)) {
      navigate({ to: "/company/$code/login", params: { code } });
      return;
    }

    Promise.all([fetchMerchantSettings(code), fetchRoutingBanks()])
      .then(([merchantSettings, routingBanks]) => {
        setSettings(merchantSettings);
        setBanks(routingBanks);
      })
      .finally(() => setLoading(false));
  }, [code, navigate]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateMerchantSettings({
        merchantId: settings.merchantId,
        merchantCode: settings.merchantCode,
        businessName: settings.businessName,
        currency: settings.currency,
        preferredBankCode: settings.preferredBankCode,
      });
      toast.success("Company settings updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  const companyName = companyCodeToLabel[code] ?? code;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{companyName} Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure merchant display details, settlement currency, and preferred routing bank.
        </p>

        {loading || !settings ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lift">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Merchant Code</Label>
                <Input readOnly className="mono" value={settings.merchantCode} />
              </div>

              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input
                  value={settings.businessName}
                  onChange={(e) =>
                    setSettings((s) => (s ? { ...s, businessName: e.target.value } : s))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Default Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(v) => setSettings((s) => (s ? { ...s, currency: v } : s))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CURRENCIES).map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Preferred Processing Bank</Label>
                  <Select
                    value={settings.preferredBankCode}
                    onValueChange={(v) =>
                      setSettings((s) => (s ? { ...s, preferredBankCode: v } : s))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.bankCode} value={bank.bankCode}>
                          {bank.bankCode} - {bank.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/company/$code" params={{ code }}>
                  Back to dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
