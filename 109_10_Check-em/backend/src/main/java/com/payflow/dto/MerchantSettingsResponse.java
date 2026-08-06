package com.payflow.dto;

public class MerchantSettingsResponse {
    private Long merchantId;
    private String merchantCode;
    private String businessName;
    private String currency;
    private String preferredBankCode;

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

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPreferredBankCode() {
        return preferredBankCode;
    }

    public void setPreferredBankCode(String preferredBankCode) {
        this.preferredBankCode = preferredBankCode;
    }
}