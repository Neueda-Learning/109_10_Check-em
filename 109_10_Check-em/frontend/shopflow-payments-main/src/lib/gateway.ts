/**
 * NovaPay — client-side mock gateway engine.
 * Simulates the core of a card-present-less payment gateway: idempotency keys,
 * acquirer/issuer routing, 2FA, reversal, charity round-up and autopay mandates.
 * All state is persisted in localStorage so the demo survives reloads.
 */

export type Currency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export const CURRENCIES: Record<Currency, { symbol: string; label: string; rateFromINR: number }> =
  {
    INR: { symbol: "₹", label: "Indian Rupee", rateFromINR: 1 },
    USD: { symbol: "$", label: "US Dollar", rateFromINR: 0.012 },
    EUR: { symbol: "€", label: "Euro", rateFromINR: 0.011 },
    GBP: { symbol: "£", label: "Pound Sterling", rateFromINR: 0.0094 },
    AED: { symbol: "د.إ", label: "UAE Dirham", rateFromINR: 0.044 },
  };

export type MethodId = "card" | "upi" | "netbanking" | "wallet" | "emi";

export const METHODS: {
  id: MethodId;
  label: string;
  hint: string;
  needs2fa: boolean;
}[] = [
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, RuPay", needs2fa: true },
  { id: "upi", label: "UPI", hint: "Pay by VPA or UPI app", needs2fa: true },
  { id: "netbanking", label: "Net Banking", hint: "58 banks supported", needs2fa: true },
  { id: "wallet", label: "Wallet", hint: "Prepaid balance, instant", needs2fa: false },
  { id: "emi", label: "EMI", hint: "3 / 6 / 9 month plans", needs2fa: true },
];

export type PaymentStatus =
  "created" | "authenticating" | "routing" | "authorized" | "captured" | "failed" | "reversed";

export type StepState = "pending" | "active" | "done" | "error";

export interface TimelineEntry {
  code: string;
  label: string;
  detail: string;
  at: string;
  state: StepState;
}

export interface GatewayError {
  code: string;
  message: string;
  hint: string;
  retriable: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  amountInr: number;
  charityInr: number;
  currency: Currency;
  method: MethodId;
  customer: { name: string; email: string; instrument: string };
  merchant: string;
  status: PaymentStatus;
  route: {
    acquirer: string;
    issuer: string;
    network: string;
    mode: "static" | "dynamic";
    reason: string;
  } | null;
  timeline: TimelineEntry[];
  error: GatewayError | null;
  reversalId: string | null;
  autopay: boolean;
}

export interface Mandate {
  id: string;
  createdAt: string;
  label: string;
  amountInr: number;
  currency: Currency;
  method: MethodId;
  frequency: "weekly" | "monthly" | "quarterly";
  nextRun: string;
  active: boolean;
  maxInr: number;
}

export interface Draft {
  orderId: string;
  idempotencyKey: string;
  merchantCode: string;
  merchantName: string;
  storeCurrency: Currency;
  amountInr: number;
  currency: Currency;
  method: MethodId | null;
  instrument: string;
  customerBankCode: string;
  charityInr: number;
  charityCause: string | null;
  customer: { name: string; email: string; phone: string };
  autopay: boolean;
  subscriptionLabel: string;
  autopayAllowed: boolean;
  forceFailure: boolean;
  fxChargeInr: number;
  fxConsentAccepted: boolean;
}

export const FX_TOTAL_RATE = 0.035;
export const FX_FIXED_FEE_INR = 10;

export function computeFxChargeInr(amountInr: number, currency: Currency): number {
  if (currency === "INR") return 0;
  const variable = amountInr * FX_TOTAL_RATE;
  return Number((variable + FX_FIXED_FEE_INR).toFixed(2));
}

const PAY_KEY = "novapay.payments";
const MANDATE_KEY = "novapay.mandates";
const DRAFT_KEY = "novapay.draft";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("novapay:change"));
}

export const rid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`.toUpperCase();

export function fmt(amountInr: number, currency: Currency) {
  const c = CURRENCIES[currency];
  const value = amountInr * c.rateFromINR;
  return `${c.symbol}${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const E164_REGEX = /^\+[1-9]\d{7,14}$/;
const UPI_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,63}@[a-zA-Z]{2,64}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidE164Phone(value: string): boolean {
  return E164_REGEX.test(value.trim());
}

export function normalizeCardNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function formatCardNumberInput(value: string): string {
  const digits = normalizeCardNumber(value).slice(0, 19);
  const chunks = digits.match(/.{1,4}/g);
  return chunks ? chunks.join(" ") : "";
}

export function isValidCardNumber(value: string): boolean {
  const digits = normalizeCardNumber(value);
  if (!/^\d{12,19}$/.test(digits)) return false;

  // Luhn checksum for PAN validation across major card networks.
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isValidCardNumber16(value: string): boolean {
  return /^\d{16}$/.test(normalizeCardNumber(value));
}

export function isValidFutureExpiry(value: string, now = new Date()): boolean {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return false;
  const [monthText, yearText] = value.split("/");
  const month = Number(monthText);
  const year = 2000 + Number(yearText);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function isValidUpiId(value: string): boolean {
  return UPI_REGEX.test(value.trim());
}

export function isValidBankName(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9 .&-]{1,63}$/.test(value.trim());
}

/* ------------------------------- draft ---------------------------------- */

export function newDraft(amountInr: number): Draft {
  return {
    orderId: rid("ord"),
    idempotencyKey: rid("idem"),
    merchantCode: "HM001",
    merchantName: "H&M",
    storeCurrency: "INR",
    amountInr,
    currency: "INR",
    method: null,
    instrument: "",
    customerBankCode: "HDFC",
    charityInr: 0,
    charityCause: null,
    customer: { name: "", email: "", phone: "" },
    autopay: false,
    subscriptionLabel: "",
    autopayAllowed: true,
    forceFailure: false,
    fxChargeInr: 0,
    fxConsentAccepted: false,
  };
}

export function getDraft(): Draft | null {
  const raw = read<Draft | null>(DRAFT_KEY, null);
  if (!raw) return null;
  return {
    ...raw,
    storeCurrency: raw.storeCurrency ?? "INR",
    subscriptionLabel: raw.subscriptionLabel ?? "",
    autopayAllowed: raw.autopayAllowed ?? true,
    fxChargeInr: raw.fxChargeInr ?? 0,
    fxConsentAccepted: raw.fxConsentAccepted ?? false,
  };
}
export const saveDraft = (d: Draft) => write(DRAFT_KEY, d);
export const clearDraft = () => {
  if (isBrowser()) window.localStorage.removeItem(DRAFT_KEY);
};

/* ------------------------------ payments -------------------------------- */

export const getPayments = () => read<Payment[]>(PAY_KEY, []);
export const getPayment = (id: string) => getPayments().find((p) => p.id === id) ?? null;

function savePayments(list: Payment[]) {
  write(PAY_KEY, list);
}

export function upsertPayment(p: Payment) {
  const list = getPayments();
  const i = list.findIndex((x) => x.id === p.id);
  if (i >= 0) list[i] = p;
  else list.unshift(p);
  savePayments(list);
}

export function entry(
  code: string,
  label: string,
  detail: string,
  state: StepState = "done",
): TimelineEntry {
  return { code, label, detail, at: new Date().toISOString(), state };
}

/** Idempotency: replaying a key returns the original payment instead of charging twice. */
export function findByIdempotencyKey(key: string) {
  return getPayments().find((p) => p.idempotencyKey === key) ?? null;
}

export function createPayment(draft: Draft): { payment: Payment; replayed: boolean } {
  const existing = findByIdempotencyKey(draft.idempotencyKey);
  if (existing) return { payment: existing, replayed: true };

  const now = new Date().toISOString();
  const payment: Payment = {
    id: rid("pay"),
    orderId: draft.orderId,
    idempotencyKey: draft.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    amountInr: draft.amountInr,
    charityInr: draft.charityInr,
    currency: draft.currency,
    method: draft.method ?? "card",
    customer: {
      name: draft.customer.name || "Guest Shopper",
      email: draft.customer.email || "guest@example.com",
      instrument: draft.instrument || "•••• 4242",
    },
    merchant: "H&M India — Store #4412",
    status: "created",
    route: null,
    timeline: [
      entry(
        "ORDER_CREATED",
        "Order created",
        `Order ${draft.orderId} registered with the merchant.`,
      ),
      entry(
        "IDEMPOTENCY_LOCK",
        "Idempotency key locked",
        `Key ${draft.idempotencyKey} reserved for 24h — replays return this same payment.`,
      ),
    ],
    error: null,
    reversalId: null,
    autopay: draft.autopay,
  };
  upsertPayment(payment);
  return { payment, replayed: false };
}

/* ------------------------------- routing -------------------------------- */

const ISSUERS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank"];

export function decideRoute(p: Payment) {
  const issuer = ISSUERS[Math.abs(hash(p.customer.email)) % ISSUERS.length]!;
  const highValue = p.amountInr > 15000;
  const dynamic = highValue || p.method === "upi";
  return {
    issuer,
    acquirer: dynamic ? "Yes Bank (acquirer)" : "NovaBank (acquirer)",
    network:
      p.method === "upi"
        ? "NPCI UPI"
        : p.method === "netbanking"
          ? "NovaNet Direct"
          : "Visa / RuPay",
    mode: (dynamic ? "dynamic" : "static") as "static" | "dynamic",
    reason: dynamic
      ? highValue
        ? "High-value txn — routed dynamically to the acquirer with the best live success rate."
        : "UPI rail selected dynamically via NPCI based on issuer health."
      : "Static route: merchant's default acquirer contract with NovaBank.",
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

export const FAILURES: GatewayError[] = [
  {
    code: "ISSUER_DECLINED",
    message: "The issuing bank declined the authorization.",
    hint: "Insufficient funds or a risk rule at the customer's bank. Ask them to retry with another instrument.",
    retriable: true,
  },
  {
    code: "ACQUIRER_TIMEOUT",
    message: "The acquirer did not respond within 30s.",
    hint: "The transaction was auto-reversed so no funds remain blocked. Safe to retry with a fresh idempotency key.",
    retriable: true,
  },
];

/* ------------------------------- mandates ------------------------------- */

export const getMandates = () => read<Mandate[]>(MANDATE_KEY, []);
export function saveMandate(m: Mandate) {
  const list = getMandates();
  const i = list.findIndex((x) => x.id === m.id);
  if (i >= 0) list[i] = m;
  else list.unshift(m);
  write(MANDATE_KEY, list);
}
export function removeMandate(id: string) {
  write(
    MANDATE_KEY,
    getMandates().filter((m) => m.id !== id),
  );
}

export const CHARITIES = [
  { id: "akshaya", name: "Akshaya Patra", blurb: "School meals for children" },
  { id: "goonj", name: "Goonj", blurb: "Clothing & disaster relief" },
  { id: "wwf", name: "WWF India", blurb: "Habitat conservation" },
];

/* ------------------------------ backend api ----------------------------- */

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  accountBalance?: number;
}

export interface ApiMerchant {
  id: number;
  businessName: string;
  merchantCode: string;
  currency: string;
}

export interface ApiDashboardMerchant {
  merchantId: number;
  merchantCode: string;
  displayName: string;
  businessName: string;
  logoUrl?: string;
  currency: string;
  autopayEnabled: boolean;
  primaryBankCode?: string;
  totalPayments: number;
  successPayments: number;
  pendingPayments: number;
  failedPayments: number;
  reversedPayments: number;
  totalProcessedAmount: number;
}

export interface ApiPayment {
  id: number;
  idempotencyKey: string;
  orderId?: string;
  autopayOptIn?: boolean;
  subscriptionLabel?: string;
  customer: ApiUser;
  merchant: ApiMerchant;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPaymentHistory {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  changedAt: string;
}

export interface ApiBankRoute {
  paymentId: number;
  merchantBankCode: string | null;
  customerBankCode: string | null;
  selectedBankCode: string;
  routingType: string;
  routeStatus: string;
  reason: string | null;
}

export interface ApiConversion {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  convertedAmount: number;
  rate: number;
}

export interface ApiReversal {
  id: number;
  amount: number;
  reason: string;
  initiatedBy: string;
  reversalStatus: string;
  createdAt: string;
}

export interface MerchantSettings {
  merchantId: number;
  merchantCode: string;
  businessName: string;
  currency: string;
  preferredBankCode: string;
  autopayEnabled: boolean;
}

export interface ApiAutopayCustomer {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  mandateCount: number;
  activeMandates: number;
  pausedMandates: number;
  totalDebitAmount: number;
  totalMaxAmount: number;
  latestOrderId: string | null;
  lastUpdatedAt: string | null;
}

export interface ApiBankNode {
  id: number;
  bankCode: string;
  bankName: string;
  currentLoad: number;
  maxCapacity: number;
}

export interface ApiMandate {
  id: number;
  label: string;
  merchantCode: string;
  customerId: number;
  paymentMethod: "CARD" | "UPI" | "BANK_TRANSFER" | "WALLET";
  instrumentType: "CARD" | "UPI" | "BANK_TRANSFER" | "WALLET";
  cardNumberMasked: string | null;
  cardHolderName: string | null;
  upiId: string | null;
  bankAccountMasked: string | null;
  bankIfsc: string | null;
  debitAmount: number;
  maxAmount: number;
  currency: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
  updatedAt: string;
}

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://10.9.78.23:8081";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Backend request timed out. Check that the Payflow backend is running on http://10.9.78.23:8081.",
      );
    }
    throw error;
  }
  clearTimeout(timeout);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = String(body.message);
    } catch {
      // Fall back to generic message.
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export const companyCodeToLabel: Record<string, string> = {
  HM001: "H&M",
  MAX001: "Max",
  IND001: "Indigo",
  HIL001: "Hilton",
};

export function getOrderItemsForMerchant(merchantCode: string) {
  if (merchantCode === "IND001") {
    return [
      { name: "Flight fare BLR -> DEL", qty: 1, inr: 5200 },
      { name: "Seat + cabin baggage", qty: 1, inr: 900 },
    ];
  }
  if (merchantCode === "HIL001") {
    return [
      { name: "Deluxe room - 1 night", qty: 1, inr: 7200 },
      { name: "Taxes and service fee", qty: 1, inr: 1300 },
    ];
  }
  if (merchantCode === "MAX001") {
    return [
      { name: "Casual wear set", qty: 1, inr: 2100 },
      { name: "Store delivery", qty: 1, inr: 140 },
    ];
  }
  return [
    { name: "H&M essentials pack", qty: 1, inr: 2450 },
    { name: "Priority delivery", qty: 1, inr: 120 },
  ];
}

export const companyVisualsByCode: Record<string, { name: string; logoUrl?: string }> = {
  HM001: { name: "H&M", logoUrl: "https://logo.clearbit.com/hm.com" },
  MAX001: { name: "Max", logoUrl: "https://logo.clearbit.com/maxfashion.com" },
  IND001: { name: "Indigo", logoUrl: "https://logo.clearbit.com/goindigo.in" },
  HIL001: { name: "Hilton", logoUrl: "https://logo.clearbit.com/hilton.com" },
};

export async function fetchMerchants() {
  return api<ApiMerchant[]>("/api/merchants");
}

export async function createMerchant(input: {
  userId?: number;
  businessName: string;
  merchantCode: string;
  currency: string;
}) {
  const params = new URLSearchParams();
  if (typeof input.userId === "number" && Number.isFinite(input.userId) && input.userId > 0) {
    params.set("userId", String(input.userId));
  }
  params.set("businessName", input.businessName.trim());
  params.set("merchantCode", input.merchantCode.trim().toUpperCase());
  params.set("currency", input.currency.trim().toUpperCase());
  return api<ApiMerchant>(`/api/merchants?${params.toString()}`, { method: "POST" });
}

export async function updateMerchant(input: {
  merchantId: number;
  businessName: string;
  currency: string;
  autopayEnabled?: boolean;
}) {
  return api<ApiMerchant>(`/api/merchants/${input.merchantId}`, {
    method: "PUT",
    body: JSON.stringify({
      businessName: input.businessName.trim(),
      currency: input.currency.trim().toUpperCase(),
      autopayEnabled: input.autopayEnabled,
    }),
  });
}

export async function deleteMerchant(merchantId: number) {
  return api<string>(`/api/merchants/${merchantId}`, { method: "DELETE" });
}

export async function fetchDashboardMerchants() {
  return api<ApiDashboardMerchant[]>("/api/merchants/dashboard");
}

export async function verifyMerchantPin(merchantCode: string, pin: string) {
  return api<{ authenticated: boolean; message: string }>(
    `/api/merchants/code/${merchantCode}/auth-pin`,
    { method: "POST", body: JSON.stringify({ pin }) },
  );
}

export async function fetchMerchantSettings(merchantCode: string) {
  return api<MerchantSettings>(`/api/merchants/code/${merchantCode}/settings`);
}

export async function fetchMerchantAutopayCustomers(merchantCode: string) {
  return api<ApiAutopayCustomer[]>(`/api/merchants/code/${merchantCode}/autopay-customers`);
}

export async function updateMerchantSettings(input: {
  merchantId: number;
  merchantCode: string;
  businessName: string;
  currency: string;
  preferredBankCode: string;
  autopayEnabled: boolean;
}) {
  await api<ApiMerchant>(`/api/merchants/${input.merchantId}`, {
    method: "PUT",
    body: JSON.stringify({
      businessName: input.businessName,
      currency: input.currency.toUpperCase(),
      autopayEnabled: input.autopayEnabled,
    }),
  });
  return api<{ message: string }>(
    `/api/payments/routing/merchant-bank?merchantCode=${encodeURIComponent(input.merchantCode)}&bankCode=${encodeURIComponent(input.preferredBankCode)}`,
    { method: "POST" },
  );
}

export async function fetchRoutingBanks() {
  return api<ApiBankNode[]>("/api/payments/routing/banks");
}

export async function fetchMerchantPayments(merchantCode: string) {
  return api<ApiPayment[]>(`/api/payments/merchant/${merchantCode}`);
}

export async function fetchPaymentById(paymentId: number) {
  return api<ApiPayment>(`/api/payments/${paymentId}`);
}

export async function fetchPaymentHistory(paymentId: number) {
  return api<ApiPaymentHistory[]>(`/api/payments/${paymentId}/history`);
}

export async function fetchPaymentRoute(paymentId: number) {
  return api<ApiBankRoute>(`/api/payments/${paymentId}/route`);
}

export async function fetchPaymentConversion(paymentId: number) {
  return api<ApiConversion>(`/api/payments/${paymentId}/conversion`);
}

export async function fetchPaymentReversals(paymentId: number) {
  return api<ApiReversal[]>(`/api/payments/${paymentId}/reversals`);
}

export async function fetchPaymentBalanceCheck(paymentId: number) {
  return api<{ paymentId: number; sufficientFunds: boolean }>(
    `/api/payments/${paymentId}/balance-check`,
  );
}

export async function createBackendPayment(input: {
  idempotencyKey: string;
  orderId: string;
  merchantCode: string;
  amount: number;
  currency: string;
  paymentMethod: MethodId;
  customerSeed: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  autopayOptIn: boolean;
  subscriptionLabel?: string;
  description: string;
}) {
  const seededCustomerId =
    Math.abs(hash(input.customerSeed)) % 3 === 0
      ? 4
      : Math.abs(hash(input.customerSeed)) % 2 === 0
        ? 3
        : 2;
  const method =
    input.paymentMethod === "netbanking"
      ? "BANK_TRANSFER"
      : input.paymentMethod === "emi"
        ? "CARD"
        : input.paymentMethod.toUpperCase();

  return api<ApiPayment>("/api/payments", {
    method: "POST",
    body: JSON.stringify({
      idempotencyKey: input.idempotencyKey,
      customerId: seededCustomerId,
      merchantCode: input.merchantCode,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: method,
      orderId: input.orderId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      autopayOptIn: input.autopayOptIn,
      subscriptionLabel: input.subscriptionLabel,
      description: input.description,
    }),
  });
}

export async function processBackendPayment(input: {
  paymentId: number;
  customerBankCode: string;
  simulateHighTraffic?: boolean;
  simulateInsufficientFunds?: boolean;
  simulateNetworkError?: boolean;
}) {
  return api<ApiPayment>(`/api/payments/${input.paymentId}/process`, {
    method: "POST",
    body: JSON.stringify({
      customerBankCode: input.customerBankCode,
      simulateHighTraffic: Boolean(input.simulateHighTraffic),
      simulateInsufficientFunds: Boolean(input.simulateInsufficientFunds),
      simulateNetworkError: Boolean(input.simulateNetworkError),
    }),
  });
}

export async function reverseBackendPayment(paymentId: number, reason: string) {
  return api<ApiPayment>(`/api/payments/${paymentId}/reverse`, {
    method: "POST",
    body: JSON.stringify({ reason, initiatedBy: "MERCHANT_DASHBOARD" }),
  });
}

export async function updateBackendPaymentDescription(paymentId: number, description: string) {
  return api<ApiPayment>(`/api/payments/${paymentId}`, {
    method: "PUT",
    body: JSON.stringify({ description }),
  });
}

export async function fetchBackendMandates(merchantCode: string) {
  return api<ApiMandate[]>(`/api/mandates?merchantCode=${encodeURIComponent(merchantCode)}`);
}

export async function createBackendMandate(input: {
  label: string;
  merchantCode: string;
  customerId: number;
  paymentMethod: "CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "WALLET";
  otp: string;
  cardNumber?: string;
  cardHolderName?: string;
  cardExpiry?: string;
  upiId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  walletPhone?: string;
  debitAmount: number;
  maxAmount: number;
  currency: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
}) {
  return api<ApiMandate>("/api/mandates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBackendMandateStatus(input: {
  mandateId: number;
  status: "ACTIVE" | "PAUSED";
  otp: string;
}) {
  return api<ApiMandate>(`/api/mandates/${input.mandateId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: input.status, otp: input.otp }),
  });
}

export async function deleteBackendMandate(mandateId: number, otp: string) {
  return api<{ message: string; mandateId: string }>(`/api/mandates/${mandateId}`, {
    method: "DELETE",
    body: JSON.stringify({ otp }),
  });
}
