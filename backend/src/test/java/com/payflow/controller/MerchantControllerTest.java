package com.payflow.controller;

import com.payflow.dto.AuthPinRequest;
import com.payflow.dto.DashboardMerchantResponse;
import com.payflow.dto.MerchantSettingsResponse;
import com.payflow.dto.UpdateMerchantRequest;
import com.payflow.model.Merchant;
import com.payflow.service.MerchantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MerchantControllerTest {

    @Mock
    private MerchantService merchantService;

    private MerchantController merchantController;

    @BeforeEach
    void setUp() {
        merchantController = new MerchantController(merchantService);
    }

    @Test
    void endpoint_post_api_merchants_createMerchant() {
        when(merchantService.createMerchant(1L, "H&M Retail", "HM001", "INR"))
                .thenReturn(sampleMerchant(1L, "HM001", "H&M Retail"));

        ResponseEntity<Merchant> response = merchantController.createMerchant(1L, "H&M Retail", "HM001", "INR");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("HM001", response.getBody().getMerchantCode());
        verify(merchantService).createMerchant(1L, "H&M Retail", "HM001", "INR");
    }

    @Test
    void endpoint_get_api_merchants_getAllMerchants() {
        when(merchantService.getAllMerchants())
                .thenReturn(Collections.singletonList(sampleMerchant(1L, "HM001", "H&M Retail")));

        ResponseEntity<List<Merchant>> response = merchantController.getAllMerchants();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(merchantService).getAllMerchants();
    }

    @Test
    void endpoint_get_api_merchants_dashboard_getDashboardMerchants() {
        DashboardMerchantResponse hm = new DashboardMerchantResponse();
        hm.setMerchantId(1L);
        hm.setMerchantCode("HM001");
        hm.setDisplayName("H&M");
        hm.setBusinessName("H&M Retail");
        hm.setCurrency("INR");
        hm.setTotalPayments(3);

        when(merchantService.getDashboardMerchants()).thenReturn(Collections.singletonList(hm));

        ResponseEntity<List<DashboardMerchantResponse>> response = merchantController.getDashboardMerchants();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("HM001", response.getBody().get(0).getMerchantCode());
        verify(merchantService).getDashboardMerchants();
    }

    @Test
    void endpoint_get_api_merchants_id_getById() {
        when(merchantService.getById(1L)).thenReturn(sampleMerchant(1L, "HM001", "H&M Retail"));

        ResponseEntity<Merchant> response = merchantController.getById(1L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().getId());
        verify(merchantService).getById(1L);
    }

    @Test
    void endpoint_get_api_merchants_code_merchantCode_getByCode() {
        when(merchantService.getByCode("HM001")).thenReturn(sampleMerchant(1L, "HM001", "H&M Retail"));

        ResponseEntity<Merchant> response = merchantController.getByCode("HM001");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("HM001", response.getBody().getMerchantCode());
        verify(merchantService).getByCode("HM001");
    }

    @Test
    void endpoint_get_api_merchants_code_merchantCode_settings_getSettings() {
        MerchantSettingsResponse settings = new MerchantSettingsResponse();
        settings.setMerchantId(1L);
        settings.setMerchantCode("HM001");
        settings.setPreferredBankCode("HSBC");
        when(merchantService.getSettings("HM001")).thenReturn(settings);

        ResponseEntity<MerchantSettingsResponse> response = merchantController.getSettings("HM001");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("HSBC", response.getBody().getPreferredBankCode());
        verify(merchantService).getSettings("HM001");
    }

    @Test
    void endpoint_post_api_merchants_code_merchantCode_auth_pin_verifyPin() {
        AuthPinRequest req = new AuthPinRequest();
        req.setPin("0000");
        when(merchantService.verifySimulationPin("HM001", "0000")).thenReturn(true);

        ResponseEntity<Map<String, Object>> response = merchantController.verifyPin("HM001", req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().get("authenticated"));
        verify(merchantService).verifySimulationPin("HM001", "0000");
    }

    @Test
    void endpoint_put_api_merchants_id_updateMerchant() {
        UpdateMerchantRequest req = new UpdateMerchantRequest();
        req.setBusinessName("H&M Retail Updated");
        req.setCurrency("USD");

        when(merchantService.updateMerchant(1L, req))
                .thenReturn(sampleMerchant(1L, "HM001", "H&M Retail Updated"));

        ResponseEntity<Merchant> response = merchantController.updateMerchant(1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("H&M Retail Updated", response.getBody().getBusinessName());
        verify(merchantService).updateMerchant(1L, req);
    }

    @Test
    void endpoint_delete_api_merchants_id_deleteMerchant() {
        ResponseEntity<String> response = merchantController.deleteMerchant(1L);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("Merchant 1 deleted successfully", response.getBody());
        verify(merchantService).deleteMerchant(1L);
    }

    private Merchant sampleMerchant(Long id, String code, String businessName) {
        Merchant merchant = new Merchant();
        merchant.setId(id);
        merchant.setMerchantCode(code);
        merchant.setBusinessName(businessName);
        merchant.setCurrency("INR");
        return merchant;
    }
}
