import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setCompanyAuthenticated } from "@/lib/company-session";
import { companyCodeToLabel, verifyMerchantPin } from "@/lib/gateway";

export const Route = createFileRoute("/company/$code/login")({
  component: CompanyLogin,
});

function CompanyLogin() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const companyName = companyCodeToLabel[code] ?? code;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await verifyMerchantPin(code, pin);
      if (!res.authenticated) {
        setError("Incorrect PIN. Use 0000 for demo.");
        return;
      }
      setCompanyAuthenticated(code, true);
      navigate({ to: "/company/$code", params: { code } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to verify PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lift">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-ink-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-3xl font-bold">{companyName} Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Merchant dashboard access is protected with a 4-digit PIN.
          </p>

          <div className="mt-6 space-y-2">
            <Label htmlFor="pin">Enter PIN</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                className="mono pl-9"
                type="password"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">Demo PIN: 0000</p>
          </div>

          <Button className="mt-6 w-full" onClick={submit} disabled={pin.length !== 4 || loading}>
            {loading ? "Verifying..." : "Enter Dashboard"}
          </Button>
        </div>
      </main>
    </div>
  );
}
