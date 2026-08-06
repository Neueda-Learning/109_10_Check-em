package com.payflow.service;

import com.payflow.dto.MerchantSettingsResponse;
import com.payflow.dto.DashboardMerchantResponse;
import com.payflow.exception.BadRequestException;
import com.payflow.dto.UpdateMerchantRequest;
import com.payflow.exception.ProcessingException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.model.Merchant;
import com.payflow.model.Payment;
import com.payflow.model.User;
import com.payflow.repository.BankRoutingRepository;
import com.payflow.repository.MerchantRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final UserRepository userRepository;
    private final BankRoutingRepository bankRoutingRepository;
    private final PaymentRepository paymentRepository;

    private static final Map<String, String> DISPLAY_NAMES = Map.of(
            "HM001", "H&M",
            "IND001", "Indigo",
            "HIL001", "Hilton"
    );
        private static final Map<String, String> LOGO_URLS = Map.of(
            "HM001", "https://logo.clearbit.com/hm.com",
            "IND001", "https://logo.clearbit.com/goindigo.in",
            "HIL001", "https://logo.clearbit.com/hilton.com"
        );

    public MerchantService(MerchantRepository merchantRepository,
                           UserRepository userRepository,
                           BankRoutingRepository bankRoutingRepository,
                           PaymentRepository paymentRepository) {
        this.merchantRepository = merchantRepository;
        this.userRepository = userRepository;
        this.bankRoutingRepository = bankRoutingRepository;
        this.paymentRepository = paymentRepository;
    }

    public Merchant createMerchant(Long userId, String businessName,
                                   String merchantCode, String currency) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Merchant merchant = new Merchant();
        merchant.setUser(user);
        merchant.setBusinessName(businessName);
        merchant.setMerchantCode(merchantCode);
        merchant.setCurrency(currency != null
            ? CurrencyConversionService.normalizeCurrencyCode(currency)
            : "INR");
        merchant.setAutopayEnabled(true);
        return merchantRepository.save(merchant);
    }

    public Merchant updateMerchant(Long id, UpdateMerchantRequest req) {
        Merchant existing = getById(id);
        String normalizedCurrency = CurrencyConversionService.normalizeCurrencyCode(req.getCurrency());
        boolean autopayEnabled = req.getAutopayEnabled() != null
                ? req.getAutopayEnabled()
                : existing.isAutopayEnabled();
        int rows = merchantRepository.update(id, req.getBusinessName(), normalizedCurrency, autopayEnabled);
        if (rows == 0) {
            throw new ProcessingException("Update failed for merchant: " + id);
        }
        existing.setBusinessName(req.getBusinessName());
        existing.setCurrency(normalizedCurrency);
        existing.setAutopayEnabled(autopayEnabled);
        return existing;
    }

    public void deleteMerchant(Long id) {
        getById(id);
        int rows = merchantRepository.deleteById(id);
        if (rows == 0) {
            throw new ProcessingException("Delete failed for merchant: " + id);
        }
    }

    public Merchant getByCode(String merchantCode) {
        return merchantRepository.findByMerchantCode(merchantCode)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found: " + merchantCode));
    }

    public Merchant getById(Long id) {
        return merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found: " + id));
    }

    public List<Merchant> getAllMerchants() {
        return merchantRepository.findAll();
    }

    public List<DashboardMerchantResponse> getDashboardMerchants() {
        return merchantRepository.findAll().stream()
                .map(this::toDashboardMerchant)
                .sorted(Comparator.comparing(DashboardMerchantResponse::getMerchantCode))
                .toList();
    }

    private DashboardMerchantResponse toDashboardMerchant(Merchant merchant) {
        DashboardMerchantResponse dto = new DashboardMerchantResponse();
        dto.setMerchantId(merchant.getId());
        dto.setMerchantCode(merchant.getMerchantCode());
        dto.setDisplayName(DISPLAY_NAMES.getOrDefault(merchant.getMerchantCode(), merchant.getBusinessName()));
        dto.setBusinessName(merchant.getBusinessName());
        dto.setLogoUrl(LOGO_URLS.getOrDefault(merchant.getMerchantCode(), ""));
        dto.setCurrency(merchant.getCurrency());
        dto.setAutopayEnabled(merchant.isAutopayEnabled());
        dto.setPrimaryBankCode(bankRoutingRepository.findPreferredBankCode(merchant.getId()).orElse("N/A"));

        List<Payment> payments = paymentRepository.findByMerchantId(merchant.getId());
        dto.setTotalPayments(payments.size());
        dto.setSuccessPayments(payments.stream().filter(p -> p.getStatus().name().equals("SUCCESS")).count());
        dto.setPendingPayments(payments.stream().filter(p -> p.getStatus().name().equals("PENDING")).count());
        dto.setFailedPayments(payments.stream().filter(p -> p.getStatus().name().equals("FAILED")).count());
        dto.setReversedPayments(payments.stream().filter(p -> p.getStatus().name().equals("REVERSED")).count());
        dto.setTotalProcessedAmount(
                payments.stream()
                        .map(Payment::getAmount)
                        .filter(amount -> amount != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        return dto;
    }

    public MerchantSettingsResponse getSettings(String merchantCode) {
        Merchant merchant = getByCode(merchantCode);
        MerchantSettingsResponse response = new MerchantSettingsResponse();
        response.setMerchantId(merchant.getId());
        response.setMerchantCode(merchant.getMerchantCode());
        response.setBusinessName(merchant.getBusinessName());
        response.setCurrency(merchant.getCurrency());
        response.setPreferredBankCode(bankRoutingRepository.findPreferredBankCode(merchant.getId()).orElse("HSBC"));
        response.setAutopayEnabled(merchant.isAutopayEnabled());
        return response;
    }

    public boolean verifySimulationPin(String merchantCode, String pin) {
        // Ensure merchant exists before answering to avoid leaking unknown codes as valid simulation targets.
        getByCode(merchantCode);
        if (pin == null || pin.isBlank()) {
            throw new BadRequestException("pin is required");
        }
        return "0000".equals(pin.trim());
    }
}