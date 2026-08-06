package com.payflow.model;

public class Merchant {
    private Long id;
    private User user;
    private String businessName;
    private String merchantCode;
    private String currency = "GBP";
    private boolean autopayEnabled = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getMerchantCode() {
        return merchantCode;
    }

    public void setMerchantCode(String merchantCode) {
        this.merchantCode = merchantCode;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isAutopayEnabled() {
        return autopayEnabled;
    }

    public void setAutopayEnabled(boolean autopayEnabled) {
        this.autopayEnabled = autopayEnabled;
    }
}