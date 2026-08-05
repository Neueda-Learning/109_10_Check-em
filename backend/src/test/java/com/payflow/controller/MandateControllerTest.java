package com.payflow.controller;

import com.payflow.dto.CreateMandateRequest;
import com.payflow.dto.MandateOtpRequest;
import com.payflow.dto.UpdateMandateStatusRequest;
import com.payflow.model.Mandate;
import com.payflow.service.MandateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MandateControllerTest {

    @Mock
    private MandateService mandateService;

    private MandateController mandateController;

    @BeforeEach
    void setUp() {
        mandateController = new MandateController(mandateService);
    }

    @Test
    void endpoint_post_api_mandates_create() {
        Mandate mandate = sampleMandate();
        when(mandateService.createMandate(any(CreateMandateRequest.class))).thenReturn(mandate);

        CreateMandateRequest req = new CreateMandateRequest();
        req.setLabel("H&M Monthly");
        req.setMerchantCode("HM001");
        req.setCustomerId(2L);
        req.setPaymentMethod("CARD");
        req.setCardNumber("4242424242424242");
        req.setCardHolderName("Aarav Sharma");
        req.setCardExpiry("08/29");
        req.setOtp("123456");
        req.setDebitAmount(new BigDecimal("500.00"));
        req.setMaxAmount(new BigDecimal("5000.00"));
        req.setCurrency("INR");
        req.setFrequency("MONTHLY");

        ResponseEntity<Mandate> response = mandateController.createMandate(req);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("ACTIVE", response.getBody().getStatus());
    }

    @Test
    void endpoint_patch_api_mandates_status_update() {
        Mandate mandate = sampleMandate();
        mandate.setStatus("PAUSED");
        when(mandateService.updateStatus(any(Long.class), any(UpdateMandateStatusRequest.class))).thenReturn(mandate);

        UpdateMandateStatusRequest req = new UpdateMandateStatusRequest();
        req.setOtp("123456");
        req.setStatus("PAUSED");

        ResponseEntity<Mandate> response = mandateController.updateMandateStatus(1L, req);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("PAUSED", response.getBody().getStatus());
    }

    @Test
    void endpoint_get_api_mandates_list() {
        when(mandateService.getMandatesByMerchant("HM001")).thenReturn(List.of(sampleMandate()));

        ResponseEntity<List<Mandate>> response = mandateController.getMandates("HM001");
        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().size());
        verify(mandateService).getMandatesByMerchant("HM001");
    }

    @Test
    void endpoint_delete_api_mandates_delete() {
        MandateOtpRequest req = new MandateOtpRequest();
        req.setOtp("123456");

        ResponseEntity<Map<String, String>> response = mandateController.deleteMandate(1L, req);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("1", response.getBody().get("mandateId"));
        verify(mandateService).deleteMandate(1L, "123456");
    }

    private Mandate sampleMandate() {
        Mandate m = new Mandate();
        m.setId(1L);
        m.setLabel("H&M Monthly");
        m.setMerchantCode("HM001");
        m.setCustomerId(2L);
        m.setPaymentMethod("CARD");
        m.setStatus("ACTIVE");
        return m;
    }
}
