package com.payflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateMandateStatusRequest extends MandateOtpRequest {

    @NotBlank(message = "status is required")
    @Pattern(regexp = "^(ACTIVE|PAUSED)$", message = "status must be ACTIVE or PAUSED")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
