package com.payflow.dto;

import java.math.BigDecimal;

public class DashboardMerchantResponse {
    private Long merchantId;
    private String merchantCode;
    private String displayName;
    private String businessName;
    private String logoUrl;
    private String currency;
    private boolean autopayEnabled;
    private String primaryBankCode;
    private long totalPayments;
    private long successPayments;
    private long pendingPayments;
    private long failedPayments;
    private long reversedPayments;
    private BigDecimal totalProcessedAmount;

    public Long getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public String getMerchantCode() {
        return merchantCode;
    }

    public void setMerchantCode(String merchantCode) {
        this.merchantCode = merchantCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPrimaryBankCode() {
        return primaryBankCode;
    }

    public void setPrimaryBankCode(String primaryBankCode) {
        this.primaryBankCode = primaryBankCode;
    }

    public boolean isAutopayEnabled() {
        return autopayEnabled;
    }

    public void setAutopayEnabled(boolean autopayEnabled) {
        this.autopayEnabled = autopayEnabled;
    }

    public long getTotalPayments() {
        return totalPayments;
    }

    public void setTotalPayments(long totalPayments) {
        this.totalPayments = totalPayments;
    }

    public long getSuccessPayments() {
        return successPayments;
    }

    public void setSuccessPayments(long successPayments) {
        this.successPayments = successPayments;
    }

    public long getPendingPayments() {
        return pendingPayments;
    }

    public void setPendingPayments(long pendingPayments) {
        this.pendingPayments = pendingPayments;
    }

    public long getFailedPayments() {
        return failedPayments;
    }

    public void setFailedPayments(long failedPayments) {
        this.failedPayments = failedPayments;
    }

    public long getReversedPayments() {
        return reversedPayments;
    }

    public void setReversedPayments(long reversedPayments) {
        this.reversedPayments = reversedPayments;
    }

    public BigDecimal getTotalProcessedAmount() {
        return totalProcessedAmount;
    }

    public void setTotalProcessedAmount(BigDecimal totalProcessedAmount) {
        this.totalProcessedAmount = totalProcessedAmount;
    }
}