package com.payflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AuthPinRequest {
    @NotBlank(message = "pin is required")
    @Pattern(regexp = "^\\d{4}$", message = "pin must be exactly 4 digits")
    private String pin;

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }
}