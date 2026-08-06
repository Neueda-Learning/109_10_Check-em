package com.payflow.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AutopayCustomerResponse {
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private long mandateCount;
    private long activeMandates;
    private long pausedMandates;
    private BigDecimal totalDebitAmount;
    private BigDecimal totalMaxAmount;
    private String latestOrderId;
    private LocalDateTime lastUpdatedAt;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public long getMandateCount() {
        return mandateCount;
    }

    public void setMandateCount(long mandateCount) {
        this.mandateCount = mandateCount;
    }

    public long getActiveMandates() {
        return activeMandates;
    }

    public void setActiveMandates(long activeMandates) {
        this.activeMandates = activeMandates;
    }

    public long getPausedMandates() {
        return pausedMandates;
    }

    public void setPausedMandates(long pausedMandates) {
        this.pausedMandates = pausedMandates;
    }

    public BigDecimal getTotalDebitAmount() {
        return totalDebitAmount;
    }

    public void setTotalDebitAmount(BigDecimal totalDebitAmount) {
        this.totalDebitAmount = totalDebitAmount;
    }

    public BigDecimal getTotalMaxAmount() {
        return totalMaxAmount;
    }

    public void setTotalMaxAmount(BigDecimal totalMaxAmount) {
        this.totalMaxAmount = totalMaxAmount;
    }

    public String getLatestOrderId() {
        return latestOrderId;
    }

    public void setLatestOrderId(String latestOrderId) {
        this.latestOrderId = latestOrderId;
    }

    public LocalDateTime getLastUpdatedAt() {
        return lastUpdatedAt;
    }

    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) {
        this.lastUpdatedAt = lastUpdatedAt;
    }
}
