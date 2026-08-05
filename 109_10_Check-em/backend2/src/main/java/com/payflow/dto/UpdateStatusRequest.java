package com.payflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateStatusRequest {
    @NotBlank(message = "status is required")
    @Pattern(regexp = "^(INITIATED|PENDING|SUCCESS|FAILED|REVERSED)$", message = "status must be INITIATED, PENDING, SUCCESS, FAILED, or REVERSED")
    private String status;

    @Size(max = 255, message = "reason must be at most 255 characters")
    private String reason;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
