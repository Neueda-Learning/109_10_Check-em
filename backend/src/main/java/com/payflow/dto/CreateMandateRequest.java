package com.payflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public class CreateMandateRequest {

    @NotBlank(message = "label is required")
    private String label;

    @NotBlank(message = "merchantCode is required")
    @Pattern(regexp = "^[A-Z0-9]{3,12}$", message = "merchantCode must be 3-12 uppercase letters/numbers")
    private String merchantCode;

    @NotNull(message = "customerId is required")
    private Long customerId;

    @NotBlank(message = "paymentMethod is required")
    @Pattern(regexp = "^(CARD|UPI|NET_BANKING|BANK_TRANSFER|WALLET)$", message = "paymentMethod must be CARD, UPI, NET_BANKING, BANK_TRANSFER, or WALLET")
    private String paymentMethod;

    @NotBlank(message = "otp is required")
    @Pattern(regexp = "^\\d{6}$", message = "otp must be a 6-digit number")
    private String otp;

    @Pattern(regexp = "^$|^\\d{12,19}$", message = "cardNumber must be 12-19 digits")
    private String cardNumber;

    private String cardHolderName;

    @Pattern(regexp = "^$|^(0[1-9]|1[0-2])/[0-9]{2}$", message = "cardExpiry must be MM/YY")
    private String cardExpiry;

    @Pattern(regexp = "^$|^[a-zA-Z0-9][a-zA-Z0-9._-]{1,63}@[a-zA-Z]{2,64}$", message = "upiId format is invalid")
    private String upiId;

    @Pattern(regexp = "^$|^[A-Za-z][A-Za-z0-9 .&-]{1,63}$", message = "bankName format is invalid")
    private String bankName;

    @Pattern(regexp = "^$|^\\d{8,18}$", message = "bankAccountNumber must be 8-18 digits")
    private String bankAccountNumber;

    @Pattern(regexp = "^$|^[A-Z]{4}0[A-Z0-9]{6}$", message = "ifsc must be a valid IFSC code")
    private String bankIfsc;

    @Pattern(regexp = "^$|^\\+[1-9]\\d{7,14}$", message = "walletPhone must be E.164 format")
    private String walletPhone;

    @NotNull(message = "debitAmount is required")
    @DecimalMin(value = "0.01", message = "debitAmount must be greater than 0")
    private BigDecimal debitAmount;

    @NotNull(message = "maxAmount is required")
    @DecimalMin(value = "0.01", message = "maxAmount must be greater than 0")
    private BigDecimal maxAmount;

    @NotBlank(message = "currency is required")
    private String currency;

    @NotBlank(message = "frequency is required")
    @Pattern(regexp = "^(WEEKLY|MONTHLY|QUARTERLY)$", message = "frequency must be WEEKLY, MONTHLY, or QUARTERLY")
    private String frequency;

    public String getMerchantCode() {
        return merchantCode;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public void setMerchantCode(String merchantCode) {
        this.merchantCode = merchantCode;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getCardHolderName() {
        return cardHolderName;
    }

    public void setCardHolderName(String cardHolderName) {
        this.cardHolderName = cardHolderName;
    }

    public String getCardExpiry() {
        return cardExpiry;
    }

    public void setCardExpiry(String cardExpiry) {
        this.cardExpiry = cardExpiry;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getBankIfsc() {
        return bankIfsc;
    }

    public void setBankIfsc(String bankIfsc) {
        this.bankIfsc = bankIfsc;
    }

    public String getWalletPhone() {
        return walletPhone;
    }

    public void setWalletPhone(String walletPhone) {
        this.walletPhone = walletPhone;
    }

    public BigDecimal getDebitAmount() {
        return debitAmount;
    }

    public void setDebitAmount(BigDecimal debitAmount) {
        this.debitAmount = debitAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public void setMaxAmount(BigDecimal maxAmount) {
        this.maxAmount = maxAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }
}
