import {
  formatCardNumberInput,
  isValidCardNumber,
  isValidCardNumber16,
  isValidE164Phone,
  isValidEmail,
  isValidFutureExpiry,
  isValidUpiId,
  normalizeCardNumber,
} from "./gateway";
import { describe, expect, it } from "vitest";

describe("gateway input validators", () => {
  it("accepts valid practical email formats", () => {
    expect(isValidEmail("aarav.sharma@example.com")).toBe(true);
    expect(isValidEmail("ops+payflow@indigo.co.in")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("bad-email")).toBe(false);
    expect(isValidEmail("name@domain")).toBe(false);
  });

  it("accepts and rejects E.164 numbers correctly", () => {
    expect(isValidE164Phone("+919876543210")).toBe(true);
    expect(isValidE164Phone("+14155550102")).toBe(true);
    expect(isValidE164Phone("9876543210")).toBe(false);
  });

  it("normalizes and validates card number with Luhn", () => {
    expect(normalizeCardNumber("4242 4242 4242 4242")).toBe("4242424242424242");
    expect(isValidCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(isValidCardNumber16("4242 4242 4242 4242")).toBe(true);
    expect(isValidCardNumber16("4242-4242-4242-4242")).toBe(true);
    expect(isValidCardNumber16("378282246310005")).toBe(false);
    expect(isValidCardNumber("4242 4242 4242 4241")).toBe(false);
  });

  it("formats card number in grouped digits and limits max digits", () => {
    expect(formatCardNumberInput("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatCardNumberInput("4242-4242-4242-4242-9999")).toBe("4242 4242 4242 4242 999");
  });

  it("validates UPI IDs", () => {
    expect(isValidUpiId("aarav@oksbi")).toBe(true);
    expect(isValidUpiId("aaravoksbi")).toBe(false);
  });

  it("accepts only current or future expiry dates", () => {
    expect(isValidFutureExpiry("08/26", new Date("2026-08-05T00:00:00Z"))).toBe(true);
    expect(isValidFutureExpiry("09/26", new Date("2026-08-05T00:00:00Z"))).toBe(true);
    expect(isValidFutureExpiry("07/26", new Date("2026-08-05T00:00:00Z"))).toBe(false);
  });
});
