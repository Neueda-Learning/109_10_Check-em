package com.payflow.service;

import com.payflow.dto.CreateMandateRequest;
import com.payflow.dto.UpdateMandateStatusRequest;
import com.payflow.exception.BadRequestException;
import com.payflow.model.Mandate;
import com.payflow.repository.MandateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MandateServiceTest {

    @Mock
    private MandateRepository mandateRepository;

    @InjectMocks
    private MandateService mandateService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mandateService, "mandateOtp", "123456");
    }

    @Test
    void createMandate_card_success() {
        CreateMandateRequest req = baseRequest();
        req.setPaymentMethod("CARD");
        req.setCardNumber("4242424242424242");
        req.setCardHolderName("Aarav Sharma");
        req.setCardExpiry("08/29");

        when(mandateRepository.save(any(Mandate.class))).thenAnswer(invocation -> {
            Mandate m = invocation.getArgument(0);
            m.setId(99L);
            return m;
        });

        Mandate created = mandateService.createMandate(req);

        assertEquals(99L, created.getId());
        assertEquals("ACTIVE", created.getStatus());
        assertEquals("**** **** **** 4242", created.getCardNumberMasked());
        verify(mandateRepository).save(any(Mandate.class));
    }

    @Test
    void createMandate_invalidOtp_throws() {
        CreateMandateRequest req = baseRequest();
        req.setOtp("000000");
        req.setPaymentMethod("UPI");
        req.setUpiId("aarav@oksbi");

        assertThrows(BadRequestException.class, () -> mandateService.createMandate(req));
    }

    @Test
    void updateStatus_requiresOtpAndUpdates() {
        Mandate existing = new Mandate();
        existing.setId(11L);
        existing.setStatus("ACTIVE");

        when(mandateRepository.findById(11L)).thenReturn(Optional.of(existing));
        when(mandateRepository.updateStatus(11L, "PAUSED")).thenReturn(1);

        UpdateMandateStatusRequest req = new UpdateMandateStatusRequest();
        req.setOtp("123456");
        req.setStatus("PAUSED");

        Mandate updated = mandateService.updateStatus(11L, req);
        assertEquals("PAUSED", updated.getStatus());
    }

    private CreateMandateRequest baseRequest() {
        CreateMandateRequest req = new CreateMandateRequest();
        req.setLabel("Monthly Essentials");
        req.setMerchantCode("HM001");
        req.setCustomerId(2L);
        req.setOtp("123456");
        req.setDebitAmount(new BigDecimal("1200.00"));
        req.setMaxAmount(new BigDecimal("5000.00"));
        req.setCurrency("INR");
        req.setFrequency("MONTHLY");
        return req;
    }
}
