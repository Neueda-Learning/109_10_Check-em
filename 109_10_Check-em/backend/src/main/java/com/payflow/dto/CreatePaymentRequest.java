package com.payflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreatePaymentRequest {
    @NotBlank(message = "idempotencyKey is required")
    @Size(min = 8, max = 100, message = "idempotencyKey must be between 8 and 100 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "idempotencyKey can contain only letters, numbers, _ and -")
    private String idempotencyKey;

    @NotNull(message = "customerId is required")
    private Long customerId;

    @NotBlank(message = "merchantCode is required")
    @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers")
    private String merchantCode;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be a 3-letter ISO code")
    private String currency;

    @NotBlank(message = "paymentMethod is required")
    @Pattern(regexp = "^(CARD|UPI|NET_BANKING|BANK_TRANSFER|WALLET)$", message = "paymentMethod must be CARD, UPI, NET_BANKING, BANK_TRANSFER, or WALLET")
    private String paymentMethod;

    @Size(max = 255, message = "description must be at most 255 characters")
    private String description;

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getMerchantCode() {
        return merchantCode;
    }

    public void setMerchantCode(String merchantCode) {
        this.merchantCode = merchantCode;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}