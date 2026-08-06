import jsPDF from "jspdf";

import { fmt, getOrderItemsForMerchant, type ApiPayment, type Currency } from "@/lib/gateway";

export function downloadCompanyPaymentsPdf(input: {
  companyName: string;
  companyCode: string;
  currency: Currency;
  payments: ApiPayment[];
}) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`${input.companyName} - Payment History`, 14, 18);
  doc.setFontSize(11);
  doc.text(`Company code: ${input.companyCode}`, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

  let y = 42;
  doc.setFontSize(10);
  doc.text("Txn ID", 14, y);
  doc.text("Status", 50, y);
  doc.text("Method", 85, y);
  doc.text("Amount", 130, y);
  doc.text("Date", 165, y);
  y += 6;

  input.payments.forEach((payment) => {
    if (y > 278) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(payment.id), 14, y);
    doc.text(payment.status, 50, y);
    doc.text(payment.paymentMethod, 85, y);
    doc.text(fmt(payment.amount, payment.currency as Currency), 130, y);
    doc.text(new Date(payment.createdAt).toLocaleDateString(), 165, y);
    y += 6;
  });

  const fileName = `${input.companyCode.toLowerCase()}-payments-${Date.now()}.pdf`;
  doc.save(fileName);
}

export function downloadPaymentReceiptPdf(payment: ApiPayment) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Payment Receipt", 14, 18);
  doc.setFontSize(11);

  doc.text(`Transaction No: ${payment.id}`, 14, 30);
  doc.text(`Status: ${payment.status}`, 14, 38);
  doc.text(`Amount: ${fmt(payment.amount, payment.currency as Currency)}`, 14, 46);
  doc.text(`Customer: ${payment.customer?.name ?? "-"}`, 14, 54);

  doc.text("Order Summary", 14, 66);
  let y = 74;
  const items = getOrderItemsForMerchant(payment.merchant?.merchantCode ?? "HM001");
  items.forEach((item) => {
    doc.text(`${item.name} x${item.qty}`, 14, y);
    doc.text(fmt(item.inr * item.qty, payment.currency as Currency), 160, y, { align: "right" });
    y += 8;
  });

  doc.text(`Total: ${fmt(payment.amount, payment.currency as Currency)}`, 14, y + 6);
  doc.save(`receipt-${payment.id}.pdf`);
}
