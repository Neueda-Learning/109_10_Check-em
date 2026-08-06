package com.payflow.controller;

import com.payflow.dto.CreatePaymentRequest;
import com.payflow.dto.ProcessPaymentRequest;
import com.payflow.dto.ReversePaymentRequest;
import com.payflow.dto.UpdatePaymentRequest;
import com.payflow.dto.UpdateStatusRequest;
import com.payflow.model.BankRouteHistory;
import com.payflow.model.BankNode;
import com.payflow.model.CurrencyConversionRecord;
import com.payflow.model.Payment;
import com.payflow.model.PaymentReversal;
import com.payflow.model.PaymentStatusHistory;
import com.payflow.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@Validated
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody CreatePaymentRequest req) {
        return ResponseEntity.ok(paymentService.createPayment(req));
    }

    // READ one
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPayment(id));
    }

    // READ history
    @GetMapping("/{id}/history")
    public ResponseEntity<List<PaymentStatusHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getHistory(id));
    }

    // READ by customer or merchant
    @GetMapping
    public ResponseEntity<List<Payment>> getPayments(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long merchantId) {
        if (customerId != null) {
            return ResponseEntity.ok(paymentService.getByCustomer(customerId));
        }
        if (merchantId != null) {
            return ResponseEntity.ok(paymentService.getByMerchant(merchantId));
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/merchant/{merchantCode}")
    public ResponseEntity<List<Payment>> getPaymentsByMerchantCode(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers") String merchantCode) {
        return ResponseEntity.ok(paymentService.getByMerchantCode(merchantCode));
    }

    // SEARCH + FILTER
    @GetMapping("/search")
    public ResponseEntity<List<Payment>> searchPayments(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long merchantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset) {
        return ResponseEntity.ok(paymentService.searchPayments(
                customerId,
                merchantId,
                status,
                paymentMethod,
                currency,
                fromDate,
                toDate,
                limit,
                offset
        ));
    }

    // PROCESS PAYMENT with bank routing and simulation controls
    @PostMapping("/{id}/process")
    public ResponseEntity<Payment> processPayment(@PathVariable Long id,
                                                  @Valid @RequestBody(required = false) ProcessPaymentRequest req) {
        return ResponseEntity.ok(paymentService.processPayment(id, req));
    }

    // REVERSE PAYMENT
    @PostMapping("/{id}/reverse")
    public ResponseEntity<Payment> reversePayment(@PathVariable Long id,
                                                  @Valid @RequestBody(required = false) ReversePaymentRequest req) {
        return ResponseEntity.ok(paymentService.reversePayment(id, req));
    }

    // PAYMENT REVERSAL HISTORY
    @GetMapping("/{id}/reversals")
    public ResponseEntity<List<PaymentReversal>> getReversals(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getReversals(id));
    }

    // ROUTING HISTORY (latest)
    @GetMapping("/{id}/route")
    public ResponseEntity<BankRouteHistory> getLatestRoute(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getLatestRoute(id));
    }

    // CURRENCY CONVERSION RECORD (latest)
    @GetMapping("/{id}/conversion")
    public ResponseEntity<CurrencyConversionRecord> getLatestConversion(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getLatestConversion(id));
    }

    @GetMapping("/{id}/balance-check")
    public ResponseEntity<Map<String, Object>> checkBalance(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of(
                "paymentId", id,
                "sufficientFunds", paymentService.hasSufficientCustomerBalance(id)
        ));
    }

    // Configure merchant preferred bank without touching merchant APIs
    @PostMapping("/routing/merchant-bank")
        public ResponseEntity<Map<String, String>> configureMerchantBank(
            @RequestParam @NotBlank @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers") String merchantCode,
            @RequestParam @NotBlank @Pattern(regexp = "^[A-Z]{3,10}$", message = "bankCode must be 3-10 uppercase letters") String bankCode) {
        paymentService.configureMerchantBank(merchantCode, bankCode);
        return ResponseEntity.ok(Map.of(
                "message", "Merchant bank route configured",
                "merchantCode", merchantCode,
                "bankCode", bankCode.toUpperCase()
        ));
    }

    @GetMapping("/routing/banks")
    public ResponseEntity<List<BankNode>> listBanks() {
        return ResponseEntity.ok(paymentService.listRoutingBanks());
    }

    // UPDATE description
    @PutMapping("/{id}")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id,
                                                 @Valid @RequestBody UpdatePaymentRequest req) {
        return ResponseEntity.ok(paymentService.updatePayment(id, req));
    }

    // UPDATE status (bank response)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Payment> updateStatus(@PathVariable Long id,
                                                @Valid @RequestBody UpdateStatusRequest req) {
        return ResponseEntity.ok(paymentService.updateStatus(id, req));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.ok("Payment " + id + " deleted successfully");
    }
}