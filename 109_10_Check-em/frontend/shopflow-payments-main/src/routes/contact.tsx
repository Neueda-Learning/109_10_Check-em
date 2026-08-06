import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { SiteHeader, SecurityStrip } from "@/components/site-header";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Check 'em" },
      {
        name: "description",
        content: "Contact the Check 'em gateway team for merchant onboarding, support, and settlement help.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-lift">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Check 'em Support</p>
          <h1 className="mt-2 text-3xl font-bold">Contact</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Need help with merchant onboarding, payment reconciliation, autopay mandates, or settlement currency settings?
            Reach the gateway operations team below.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <ContactCard
            icon={<Mail className="h-5 w-5" />}
            title="Email"
            body="support@checkem-payments.demo"
            caption="Response within one business day"
          />
          <ContactCard
            icon={<Phone className="h-5 w-5" />}
            title="Phone"
            body="+91 1800 123 9000"
            caption="Mon-Sat · 09:00 to 18:00 IST"
          />
          <ContactCard
            icon={<MapPin className="h-5 w-5" />}
            title="Operations Desk"
            body="Bengaluru Gateway Hub"
            caption="Merchant support and settlement ops"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card text-sm text-muted-foreground">
          For test merchants in this demo, use PIN 0000 on the company login page. Local support can also validate route,
          reversal, and FX-charge simulation behavior.
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <SecurityStrip />
        </div>
      </main>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  body,
  caption,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-foreground">{body}</p>
      <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}
