import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lock, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { CheckoutShell } from "@/components/checkout-shell";
import { OrderSummary } from "@/components/order-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useDraft } from "@/hooks/use-draft";
import { createBackendPayment, METHODS } from "@/lib/gateway";

export const Route = createFileRoute("/pay/verify")({
  head: () => ({
    meta: [
      { title: "Two-factor verification — NovaPay" },
      {
        name: "description",
        content:
          "Confirm your payment with a one-time passcode. NovaPay enforces 2-factor authentication on every transaction.",
      },
      { property: "og:title", content: "Two-factor verification — NovaPay" },
      {
        property: "og:description",
        content: "One-time passcode step-up before any authorization is sent to your bank.",
      },
    ],
  }),
  component: VerifyStep,
});

const DEMO_OTP = "123456";
const DEMO_PIN = "0000";

function VerifyStep() {
  const navigate = useNavigate();
  const { draft } = useDraft();
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [pinValidated, setPinValidated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(45);
  const [creating, setCreating] = useState(false);
  const created = useRef(false);

  useEffect(() => {
    if (!draft || created.current) return;
    if (draft.currency !== "INR" && !draft.fxConsentAccepted) {
      navigate({ to: "/pay/charity" });
      return;
    }
    created.current = true;
    setCreating(true);
    createBackendPayment({
      idempotencyKey: draft.idempotencyKey,
      merchantCode: draft.merchantCode,
      amount: Number((draft.amountInr + draft.charityInr + (draft.fxChargeInr ?? 0)).toFixed(2)),
      currency: draft.currency,
      paymentMethod: draft.method ?? "card",
      customerSeed: draft.customer.email,
      description: `Checkout for ${draft.merchantName}`,
    })
      .then((payment) => setPaymentId(payment.id))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Unable to create payment");
        navigate({
          to: "/gateway",
          search: { merchantCode: draft.merchantCode, merchantName: draft.merchantName },
        });
      })
      .finally(() => setCreating(false));
  }, [draft, navigate]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!draft) return null;

  const needs2fa = METHODS.find((m) => m.id === draft.method)?.needs2fa ?? true;

  const submit = (code: string) => {
    if (!paymentId) return;

    if (code !== DEMO_OTP) {
      const next = attempts + 1;
      setAttempts(next);
      setOtp("");
      if (next >= 3) {
        toast.error("Too many incorrect OTP attempts. Please start again.");
        navigate({
          to: "/gateway",
          search: { merchantCode: draft.merchantCode, merchantName: draft.merchantName },
        });
        return;
      }
      setError(`Incorrect passcode. ${3 - next} attempt${3 - next === 1 ? "" : "s"} left.`);
      return;
    }

    navigate({ to: "/pay/processing", search: { id: String(paymentId) } });
  };

  const skip = () => {
    if (!paymentId) return;
    navigate({ to: "/pay/processing", search: { id: String(paymentId) } });
  };

  return (
    <CheckoutShell
      step="verify"
      title="Confirm it's really you"
      subtitle="This is the RBI-mandated second factor. Your bank issued the code — NovaPay never sees your banking password."
      aside={<OrderSummary draft={draft} />}
    >
      <div className="space-y-6">
        {creating && (
          <p className="text-sm text-muted-foreground">Creating payment request with backend...</p>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {needs2fa ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-ink-foreground">
                  <Smartphone className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">One-time passcode sent</p>
                  <p className="text-xs text-muted-foreground">
                    To the mobile registered with your bank · ends 3210
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                {!pinValidated ? (
                  <div className="w-full max-w-xs">
                    <p className="mb-2 text-center text-xs text-muted-foreground">
                      Step 1: Enter 4-digit card PIN
                    </p>
                    <Input
                      className="mono text-center"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="0000"
                    />
                    <Button
                      className="mt-3 w-full"
                      onClick={() => {
                        if (pin !== DEMO_PIN) {
                          setError("Incorrect PIN. Use 0000 for demo.");
                          return;
                        }
                        setError(null);
                        setPinValidated(true);
                      }}
                      disabled={pin.length !== 4}
                    >
                      Validate PIN
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-center text-xs text-muted-foreground">
                      Step 2: Enter 6-digit OTP
                    </p>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(v) => {
                        setOtp(v);
                        setError(null);
                        if (v.length === 6) submit(v);
                      }}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-4 text-center text-sm font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Demo PIN: <span className="mono font-semibold">0000</span> · Demo OTP:{" "}
                <span className="mono font-semibold">123456</span>
              </p>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                {seconds > 0 ? (
                  <span className="mono">Resend available in {seconds}s</span>
                ) : (
                  <button
                    className="font-medium text-primary underline underline-offset-4"
                    onClick={() => setSeconds(45)}
                  >
                    Resend passcode
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-success" />
              <p className="mt-3 text-sm font-semibold">No second factor needed</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Wallet balances are pre-authorised at top-up time.
              </p>
              <Button className="mt-5" onClick={skip}>
                Authorise payment
              </Button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-success" /> Session locked to this device and expires
            in 10 minutes.
          </div>
        </div>

        <Button variant="outline" onClick={() => navigate({ to: "/pay/charity" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    </CheckoutShell>
  );
}
