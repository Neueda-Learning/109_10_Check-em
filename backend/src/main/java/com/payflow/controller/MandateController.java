package com.payflow.controller;

import com.payflow.dto.CreateMandateRequest;
import com.payflow.dto.MandateOtpRequest;
import com.payflow.dto.UpdateMandateStatusRequest;
import com.payflow.model.Mandate;
import com.payflow.service.MandateService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mandates")
@Validated
public class MandateController {

    private final MandateService mandateService;

    public MandateController(MandateService mandateService) {
        this.mandateService = mandateService;
    }

    @PostMapping
    public ResponseEntity<Mandate> createMandate(@Valid @RequestBody CreateMandateRequest req) {
        return ResponseEntity.ok(mandateService.createMandate(req));
    }

    @GetMapping
    public ResponseEntity<List<Mandate>> getMandates(
            @RequestParam @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers")
            String merchantCode) {
        return ResponseEntity.ok(mandateService.getMandatesByMerchant(merchantCode));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Mandate> updateMandateStatus(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateMandateStatusRequest req) {
        return ResponseEntity.ok(mandateService.updateStatus(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMandate(@PathVariable Long id,
                                                              @Valid @RequestBody MandateOtpRequest req) {
        mandateService.deleteMandate(id, req.getOtp());
        return ResponseEntity.ok(Map.of("message", "Mandate deleted", "mandateId", String.valueOf(id)));
    }
}
