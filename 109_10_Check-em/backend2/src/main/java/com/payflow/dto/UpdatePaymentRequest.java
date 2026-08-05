package com.payflow.dto;

import jakarta.validation.constraints.Size;

public class UpdatePaymentRequest {
    @Size(max = 255, message = "description must be at most 255 characters")
    private String description;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}