package com.payflow.model;

import java.time.LocalDateTime;

public class BankRouteHistory {
    private Long id;
    private Long paymentId;
    private String merchantBankCode;
    private String customerBankCode;
    private String selectedBankCode;
    private String routingType;
    private String routeStatus;
    private String reason;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public String getMerchantBankCode() {
        return merchantBankCode;
    }

    public void setMerchantBankCode(String merchantBankCode) {
        this.merchantBankCode = merchantBankCode;
    }

    public String getCustomerBankCode() {
        return customerBankCode;
    }

    public void setCustomerBankCode(String customerBankCode) {
        this.customerBankCode = customerBankCode;
    }

    public String getSelectedBankCode() {
        return selectedBankCode;
    }

    public void setSelectedBankCode(String selectedBankCode) {
        this.selectedBankCode = selectedBankCode;
    }

    public String getRoutingType() {
        return routingType;
    }

    public void setRoutingType(String routingType) {
        this.routingType = routingType;
    }

    public String getRouteStatus() {
        return routeStatus;
    }

    public void setRouteStatus(String routeStatus) {
        this.routeStatus = routeStatus;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
