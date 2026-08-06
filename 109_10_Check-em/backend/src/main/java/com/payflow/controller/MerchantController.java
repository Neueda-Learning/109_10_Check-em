package com.payflow.controller;

import com.payflow.dto.AutopayCustomerResponse;
import com.payflow.dto.AuthPinRequest;
import com.payflow.dto.DashboardMerchantResponse;
import com.payflow.dto.MerchantSettingsResponse;
import com.payflow.dto.UpdateMerchantRequest;
import com.payflow.model.Merchant;
import com.payflow.service.MerchantService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/merchants")
@Validated
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Merchant> createMerchant(
            @RequestParam(required = false) Long userId,
            @RequestParam @NotBlank @Pattern(regexp = "^.{2,255}$", message = "businessName must be between 2 and 255 characters") String businessName,
            @RequestParam @NotBlank @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers") String merchantCode,
            @RequestParam(required = false) @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be a 3-letter ISO code") String currency) {
        return ResponseEntity.ok(merchantService
                .createMerchant(userId, businessName, merchantCode, currency));
    }

    // READ all
    @GetMapping
    public ResponseEntity<List<Merchant>> getAllMerchants() {
        return ResponseEntity.ok(merchantService.getAllMerchants());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<List<DashboardMerchantResponse>> getDashboardMerchants() {
        return ResponseEntity.ok(merchantService.getDashboardMerchants());
    }

    // READ one by ID
    @GetMapping("/{id}")
    public ResponseEntity<Merchant> getById(@PathVariable Long id) {
        return ResponseEntity.ok(merchantService.getById(id));
    }

    // READ one by code
    @GetMapping("/code/{merchantCode}")
    public ResponseEntity<Merchant> getByCode(@PathVariable String merchantCode) {
        return ResponseEntity.ok(merchantService.getByCode(merchantCode));
    }

    @GetMapping("/code/{merchantCode}/settings")
    public ResponseEntity<MerchantSettingsResponse> getSettings(@PathVariable String merchantCode) {
        return ResponseEntity.ok(merchantService.getSettings(merchantCode));
    }

    @GetMapping("/code/{merchantCode}/autopay-customers")
    public ResponseEntity<List<AutopayCustomerResponse>> getAutopayCustomers(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers") String merchantCode) {
        return ResponseEntity.ok(merchantService.getAutopayCustomers(merchantCode));
    }

    @PostMapping("/code/{merchantCode}/auth-pin")
    public ResponseEntity<java.util.Map<String, Object>> verifyPin(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers") String merchantCode,
            @Valid @RequestBody AuthPinRequest req) {
        boolean valid = merchantService.verifySimulationPin(merchantCode, req.getPin());
        return ResponseEntity.ok(java.util.Map.of(
                "merchantCode", merchantCode,
                "authenticated", valid,
                "message", valid ? "PIN verified" : "Invalid PIN"
        ));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Merchant> updateMerchant(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateMerchantRequest req) {
        return ResponseEntity.ok(merchantService.updateMerchant(id, req));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMerchant(@PathVariable Long id) {
        merchantService.deleteMerchant(id);
        return ResponseEntity.ok("Merchant " + id + " deleted successfully");
    }
}