package com.payflow.dto;

import jakarta.validation.constraints.Pattern;

public class ProcessPaymentRequest {
    @Pattern(regexp = "^[A-Z]{3,10}$", message = "customerBankCode must be 3-10 uppercase letters")
    private String customerBankCode;
    private Boolean simulateHighTraffic;
    private Boolean simulateInsufficientFunds;
    private Boolean simulateNetworkError;

    public String getCustomerBankCode() {
        return customerBankCode;
    }

    public void setCustomerBankCode(String customerBankCode) {
        this.customerBankCode = customerBankCode;
    }

    public Boolean getSimulateHighTraffic() {
        return simulateHighTraffic;
    }

    public void setSimulateHighTraffic(Boolean simulateHighTraffic) {
        this.simulateHighTraffic = simulateHighTraffic;
    }

    public Boolean getSimulateInsufficientFunds() {
        return simulateInsufficientFunds;
    }

    public void setSimulateInsufficientFunds(Boolean simulateInsufficientFunds) {
        this.simulateInsufficientFunds = simulateInsufficientFunds;
    }

    public Boolean getSimulateNetworkError() {
        return simulateNetworkError;
    }

    public void setSimulateNetworkError(Boolean simulateNetworkError) {
        this.simulateNetworkError = simulateNetworkError;
    }
}
