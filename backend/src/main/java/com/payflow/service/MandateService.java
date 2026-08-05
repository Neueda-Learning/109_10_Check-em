package com.payflow.service;

import com.payflow.dto.CreateMandateRequest;
import com.payflow.dto.UpdateMandateStatusRequest;
import com.payflow.exception.BadRequestException;
import com.payflow.exception.ProcessingException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.model.Mandate;
import com.payflow.repository.MandateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MandateService {

    private final MandateRepository mandateRepository;

    @Value("${payflow.mandate.otp:123456}")
    private String mandateOtp;

    public MandateService(MandateRepository mandateRepository) {
        this.mandateRepository = mandateRepository;
    }

    public Mandate createMandate(CreateMandateRequest req) {
        validateOtp(req.getOtp());
        validateInstrument(req);

        if (req.getLabel() == null || req.getLabel().isBlank()) {
            throw new BadRequestException("label is required");
        }

        String method = normalizeMethod(req.getPaymentMethod());
        Mandate mandate = new Mandate();
        mandate.setLabel(req.getLabel().trim());
        mandate.setMerchantCode(req.getMerchantCode().trim().toUpperCase());
        mandate.setCustomerId(req.getCustomerId());
        mandate.setPaymentMethod(method);
        mandate.setInstrumentType(instrumentTypeFor(method));
        mandate.setCardNumberMasked(maskCard(req.getCardNumber()));
        mandate.setCardHolderName(blankToNull(req.getCardHolderName()));
        mandate.setUpiId(blankToNull(req.getUpiId()));
        mandate.setBankAccountMasked(maskBankAccount(req.getBankAccountNumber()));
        mandate.setBankIfsc(blankToNull(req.getBankIfsc()));
        mandate.setDebitAmount(req.getDebitAmount());
        mandate.setMaxAmount(req.getMaxAmount());
        mandate.setCurrency(CurrencyConversionService.normalizeCurrencyCode(req.getCurrency()));
        mandate.setFrequency(req.getFrequency().trim().toUpperCase());
        mandate.setStatus("ACTIVE");

        if (req.getMaxAmount().compareTo(req.getDebitAmount()) < 0) {
            throw new BadRequestException("maxAmount must be greater than or equal to debitAmount");
        }

        return mandateRepository.save(mandate);
    }

    public List<Mandate> getMandatesByMerchant(String merchantCode) {
        if (merchantCode == null || merchantCode.isBlank()) {
            throw new BadRequestException("merchantCode is required");
        }
        return mandateRepository.findByMerchantCode(merchantCode.trim().toUpperCase());
    }

    public Mandate updateStatus(Long mandateId, UpdateMandateStatusRequest req) {
        validateOtp(req.getOtp());
        Mandate mandate = mandateRepository.findById(mandateId)
                .orElseThrow(() -> new ResourceNotFoundException("Mandate not found: " + mandateId));

        String normalizedStatus = req.getStatus().trim().toUpperCase();
        int rows = mandateRepository.updateStatus(mandateId, normalizedStatus);
        if (rows == 0) {
            throw new ProcessingException("Unable to update mandate status: " + mandateId);
        }

        mandate.setStatus(normalizedStatus);
        return mandate;
    }

    public void deleteMandate(Long mandateId, String otp) {
        validateOtp(otp);
        mandateRepository.findById(mandateId)
                .orElseThrow(() -> new ResourceNotFoundException("Mandate not found: " + mandateId));

        int rows = mandateRepository.deleteById(mandateId);
        if (rows == 0) {
            throw new ProcessingException("Unable to delete mandate: " + mandateId);
        }
    }

    private void validateOtp(String otp) {
        if (otp == null || otp.isBlank()) {
            throw new BadRequestException("otp is required");
        }
        if (!mandateOtp.equals(otp.trim())) {
            throw new BadRequestException("Invalid OTP");
        }
    }

    private String normalizeMethod(String method) {
        String normalized = method.trim().toUpperCase();
        if ("NET_BANKING".equals(normalized)) {
            return "BANK_TRANSFER";
        }
        return normalized;
    }

    private String instrumentTypeFor(String method) {
        return switch (method) {
            case "CARD" -> "CARD";
            case "UPI" -> "UPI";
            case "BANK_TRANSFER" -> "BANK_TRANSFER";
            case "WALLET" -> "WALLET";
            default -> throw new BadRequestException("Unsupported method for mandate: " + method);
        };
    }

    private void validateInstrument(CreateMandateRequest req) {
        String method = normalizeMethod(req.getPaymentMethod());
        if ("CARD".equals(method)) {
            if (req.getCardNumber() == null || req.getCardNumber().isBlank()) {
                throw new BadRequestException("cardNumber is required for CARD mandates");
            }
            if (req.getCardHolderName() == null || req.getCardHolderName().isBlank()) {
                throw new BadRequestException("cardHolderName is required for CARD mandates");
            }
            if (req.getCardExpiry() == null || req.getCardExpiry().isBlank()) {
                throw new BadRequestException("cardExpiry is required for CARD mandates");
            }
        } else if ("UPI".equals(method)) {
            if (req.getUpiId() == null || req.getUpiId().isBlank()) {
                throw new BadRequestException("upiId is required for UPI mandates");
            }
        } else if ("BANK_TRANSFER".equals(method)) {
            if (req.getBankAccountNumber() == null || req.getBankAccountNumber().isBlank()) {
                throw new BadRequestException("bankAccountNumber is required for BANK_TRANSFER mandates");
            }
            if (req.getBankIfsc() == null || req.getBankIfsc().isBlank()) {
                throw new BadRequestException("bankIfsc is required for BANK_TRANSFER mandates");
            }
        }
    }

    private String maskCard(String cardNumber) {
        if (cardNumber == null || cardNumber.isBlank()) {
            return null;
        }
        String digits = cardNumber.replaceAll("[^0-9]", "");
        if (digits.length() < 4) {
            return "****";
        }
        return "**** **** **** " + digits.substring(digits.length() - 4);
    }

    private String maskBankAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        String digits = accountNumber.replaceAll("[^0-9]", "");
        if (digits.length() < 4) {
            return "****";
        }
        return "XXXX" + digits.substring(digits.length() - 4);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
