package com.payflow.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ReversePaymentRequest {
    @Size(max = 255, message = "reason must be at most 255 characters")
    private String reason;

    @Size(max = 120, message = "initiatedBy must be at most 120 characters")
    @Pattern(regexp = "^[A-Za-z0-9_ -]*$", message = "initiatedBy can contain letters, numbers, spaces, _ and -")
    private String initiatedBy;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }
}
