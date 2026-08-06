package com.payflow.controller;

import com.payflow.dto.CreatePaymentRequest;
import com.payflow.dto.ProcessPaymentRequest;
import com.payflow.dto.ReversePaymentRequest;
import com.payflow.dto.UpdatePaymentRequest;
import com.payflow.dto.UpdateStatusRequest;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import com.payflow.model.BankRouteHistory;
import com.payflow.model.BankNode;
import com.payflow.model.CurrencyConversionRecord;
import com.payflow.model.Merchant;
import com.payflow.model.Payment;
import com.payflow.model.PaymentReversal;
import com.payflow.model.PaymentStatusHistory;
import com.payflow.model.User;
import com.payflow.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    private PaymentController paymentController;

    @BeforeEach
    void setUp() {
        paymentController = new PaymentController(paymentService);
    }

    @Test
    void endpoint_post_api_payments_createPayment() {
        Payment payment = samplePayment(1L, PaymentStatus.INITIATED);
        when(paymentService.createPayment(ArgumentMatchers.any(CreatePaymentRequest.class)))
                .thenReturn(payment);

        CreatePaymentRequest req = new CreatePaymentRequest();
        req.setIdempotencyKey("idemp-101");
        req.setCustomerId(2L);
        req.setMerchantCode("HM001");
        req.setAmount(new BigDecimal("120.00"));
        req.setCurrency("INR");
        req.setPaymentMethod("UPI");

        ResponseEntity<Payment> response = paymentController.createPayment(req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().getId());
        verify(paymentService).createPayment(req);
    }

    @Test
    void endpoint_get_api_payments_id_getPayment() {
        when(paymentService.getPayment(5L)).thenReturn(samplePayment(5L, PaymentStatus.SUCCESS));

        ResponseEntity<Payment> response = paymentController.getPayment(5L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(5L, response.getBody().getId());
        verify(paymentService).getPayment(5L);
    }

    @Test
    void endpoint_get_api_payments_id_history_getHistory() {
        PaymentStatusHistory history = new PaymentStatusHistory();
        history.setId(1L);
        history.setNewStatus("SUCCESS");
        when(paymentService.getHistory(8L)).thenReturn(Collections.singletonList(history));

        ResponseEntity<List<PaymentStatusHistory>> response = paymentController.getHistory(8L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(paymentService).getHistory(8L);
    }

    @Test
    void endpoint_get_api_payments_getPayments_byCustomerId() {
        when(paymentService.getByCustomer(2L))
                .thenReturn(Collections.singletonList(samplePayment(2L, PaymentStatus.SUCCESS)));

        ResponseEntity<List<Payment>> response = paymentController.getPayments(2L, null);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(paymentService).getByCustomer(2L);
    }

    @Test
    void endpoint_get_api_payments_getPayments_byMerchantId() {
        when(paymentService.getByMerchant(1L))
                .thenReturn(Collections.singletonList(samplePayment(3L, PaymentStatus.PENDING)));

        ResponseEntity<List<Payment>> response = paymentController.getPayments(null, 1L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(paymentService).getByMerchant(1L);
    }

    @Test
    void endpoint_get_api_payments_getPayments_withoutFilters_returnsBadRequest() {
        ResponseEntity<List<Payment>> response = paymentController.getPayments(null, null);

        assertEquals(400, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void endpoint_get_api_payments_merchant_code_getPaymentsByMerchantCode() {
        when(paymentService.getByMerchantCode("HM001"))
                .thenReturn(Collections.singletonList(samplePayment(22L, PaymentStatus.SUCCESS)));

        ResponseEntity<List<Payment>> response = paymentController.getPaymentsByMerchantCode("HM001");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(paymentService).getByMerchantCode("HM001");
    }

    @Test
    void endpoint_get_api_payments_search_searchPayments() {
        when(paymentService.searchPayments(
                2L,
                1L,
                "SUCCESS",
                "UPI",
                "INR",
                "2026-08-01T00:00:00",
                "2026-08-10T23:59:59",
                20,
                0))
                .thenReturn(Collections.singletonList(samplePayment(2L, PaymentStatus.SUCCESS)));

        ResponseEntity<List<Payment>> response = paymentController.searchPayments(
                2L, 1L, "SUCCESS", "UPI", "INR", "2026-08-01T00:00:00", "2026-08-10T23:59:59", 20, 0);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(paymentService).searchPayments(2L, 1L, "SUCCESS", "UPI", "INR",
                "2026-08-01T00:00:00", "2026-08-10T23:59:59", 20, 0);
    }

    @Test
    void endpoint_post_api_payments_id_process_processPayment() {
        when(paymentService.processPayment(ArgumentMatchers.eq(3L), ArgumentMatchers.any(ProcessPaymentRequest.class)))
                .thenReturn(samplePayment(3L, PaymentStatus.SUCCESS));

        ProcessPaymentRequest req = new ProcessPaymentRequest();
        req.setCustomerBankCode("HDFC");
        ResponseEntity<Payment> response = paymentController.processPayment(3L, req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(PaymentStatus.SUCCESS, response.getBody().getStatus());
        verify(paymentService).processPayment(3L, req);
    }

    @Test
    void endpoint_post_api_payments_id_reverse_reversePayment() {
        when(paymentService.reversePayment(ArgumentMatchers.eq(4L), ArgumentMatchers.any(ReversePaymentRequest.class)))
                .thenReturn(samplePayment(4L, PaymentStatus.REVERSED));

        ReversePaymentRequest req = new ReversePaymentRequest();
        req.setReason("Customer requested cancellation");
        ResponseEntity<Payment> response = paymentController.reversePayment(4L, req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(PaymentStatus.REVERSED, response.getBody().getStatus());
        verify(paymentService).reversePayment(4L, req);
    }

    @Test
    void endpoint_get_api_payments_id_reversals_getReversals() {
        PaymentReversal reversal = new PaymentReversal();
        reversal.setId(11L);
        reversal.setReason("Auto reversal");
        when(paymentService.getReversals(9L)).thenReturn(Collections.singletonList(reversal));

        ResponseEntity<List<PaymentReversal>> response = paymentController.getReversals(9L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(paymentService).getReversals(9L);
    }

    @Test
    void endpoint_get_api_payments_id_route_getLatestRoute() {
        BankRouteHistory route = new BankRouteHistory();
        route.setId(12L);
        route.setSelectedBankCode("HSBC");
        when(paymentService.getLatestRoute(10L)).thenReturn(route);

        ResponseEntity<BankRouteHistory> response = paymentController.getLatestRoute(10L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("HSBC", response.getBody().getSelectedBankCode());
        verify(paymentService).getLatestRoute(10L);
    }

    @Test
    void endpoint_get_api_payments_id_conversion_getLatestConversion() {
        CurrencyConversionRecord record = new CurrencyConversionRecord();
        record.setId(13L);
        record.setSourceCurrency("USD");
        record.setTargetCurrency("INR");
        when(paymentService.getLatestConversion(10L)).thenReturn(record);

        ResponseEntity<CurrencyConversionRecord> response = paymentController.getLatestConversion(10L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("USD", response.getBody().getSourceCurrency());
        verify(paymentService).getLatestConversion(10L);
    }

    @Test
    void endpoint_post_api_payments_routing_merchant_bank_configureMerchantBank() {
        ResponseEntity<Map<String, String>> response = paymentController.configureMerchantBank("HM001", "hdfc");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("HM001", response.getBody().get("merchantCode"));
        assertEquals("HDFC", response.getBody().get("bankCode"));
        verify(paymentService).configureMerchantBank("HM001", "hdfc");
    }

    @Test
    void endpoint_get_api_payments_routing_banks_listBanks() {
        BankNode node = new BankNode();
        node.setBankCode("HSBC");
        node.setBankName("HSBC Bank India");
        when(paymentService.listRoutingBanks()).thenReturn(Collections.singletonList(node));

        ResponseEntity<List<BankNode>> response = paymentController.listBanks();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("HSBC", response.getBody().get(0).getBankCode());
        verify(paymentService).listRoutingBanks();
    }

    @Test
    void endpoint_put_api_payments_id_updatePayment() {
        UpdatePaymentRequest req = new UpdatePaymentRequest();
        req.setDescription("Updated description");
        when(paymentService.updatePayment(6L, req)).thenReturn(samplePayment(6L, PaymentStatus.PENDING));

        ResponseEntity<Payment> response = paymentController.updatePayment(6L, req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(6L, response.getBody().getId());
        verify(paymentService).updatePayment(6L, req);
    }

    @Test
    void endpoint_patch_api_payments_id_status_updateStatus() {
        when(paymentService.updateStatus(ArgumentMatchers.eq(7L), ArgumentMatchers.any(UpdateStatusRequest.class)))
                .thenReturn(samplePayment(7L, PaymentStatus.FAILED));

        UpdateStatusRequest req = new UpdateStatusRequest();
        req.setStatus("FAILED");
        req.setReason("timeout");

        ResponseEntity<Payment> response = paymentController.updateStatus(7L, req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(7L, response.getBody().getId());
        verify(paymentService).updateStatus(7L, req);
    }

    @Test
    void endpoint_delete_api_payments_id_deletePayment() {
        ResponseEntity<String> response = paymentController.deletePayment(14L);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("Payment 14 deleted successfully", response.getBody());
        verify(paymentService).deletePayment(14L);
    }

    private Payment samplePayment(Long id, PaymentStatus status) {
        User user = new User();
        user.setId(2L);
        user.setName("Alice");

        Merchant merchant = new Merchant();
        merchant.setId(1L);
        merchant.setMerchantCode("HM001");
        merchant.setBusinessName("H&M");
        merchant.setCurrency("INR");

        Payment payment = new Payment();
        payment.setId(id);
        payment.setIdempotencyKey("key-" + id);
        payment.setCustomer(user);
        payment.setMerchant(merchant);
        payment.setAmount(new BigDecimal("100.00"));
        payment.setCurrency("INR");
        payment.setPaymentMethod(PaymentMethod.UPI);
        payment.setStatus(status);
        payment.setDescription("sample");
        return payment;
    }
}
