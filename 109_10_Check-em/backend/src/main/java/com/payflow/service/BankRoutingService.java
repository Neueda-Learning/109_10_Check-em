package com.payflow.service;

import com.payflow.exception.BadRequestException;
import com.payflow.exception.ProcessingException;
import com.payflow.model.BankNode;
import com.payflow.model.BankRouteHistory;
import com.payflow.model.Merchant;
import com.payflow.model.Payment;
import com.payflow.repository.BankRoutingRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class BankRoutingService {

    private final BankRoutingRepository routingRepository;

    public BankRoutingService(BankRoutingRepository routingRepository) {
        this.routingRepository = routingRepository;
    }

    public void seedDefaultBanks() {
        routingRepository.upsertBankNode("HSBC", "HSBC Bank India", 120, 90);
        routingRepository.upsertBankNode("HDFC", "HDFC Bank", 150, 95);
        routingRepository.upsertBankNode("ICICI", "ICICI Bank", 140, 92);
        routingRepository.upsertBankNode("SBI", "State Bank of India", 300, 100);
        routingRepository.upsertBankNode("SIB", "South Indian Bank", 100, 80);
    }

    public void ensureMerchantBankMapping(Merchant merchant, String merchantBankCode) {
        String normalized = normalizeBankCode(merchantBankCode);
        routingRepository.upsertMerchantRoute(merchant.getId(), normalized);
    }

    public RouteDecision chooseProcessingBank(Payment payment,
                                              String customerBankCode,
                                              boolean simulateHighTraffic) {
        Merchant merchant = payment.getMerchant();
        String merchantBankCode = routingRepository.findPreferredBankCode(merchant.getId())
                .orElse("HSBC");
        merchantBankCode = normalizeBankCode(merchantBankCode);

        String normalizedCustomerBank = normalizeNullableBankCode(customerBankCode);

        Optional<BankNode> merchantBank = routingRepository.findActiveBankByCode(merchantBankCode);
        if (merchantBank.isEmpty()) {
            throw new ProcessingException("Configured merchant bank is unavailable: " + merchantBankCode);
        }

        if (normalizedCustomerBank != null && !isKnownBank(normalizedCustomerBank)) {
            throw new BadRequestException("Unsupported customer bank code: " + normalizedCustomerBank);
        }

        boolean directBankMatch = normalizedCustomerBank != null && normalizedCustomerBank.equals(merchantBankCode);
        boolean overloaded = isOverloaded(merchantBank.get()) || simulateHighTraffic;

        String selectedBankCode = merchantBankCode;
        String routeType = directBankMatch ? "DIRECT" : "INTER_BANK";
        String reason = directBankMatch
                ? "Merchant and customer use same bank"
                : "Inter-bank routing applied";

        if (overloaded) {
            selectedBankCode = routingRepository.findLeastLoadedBankExcluding(merchantBankCode)
                    .map(BankNode::getBankCode)
                    .orElseThrow(() -> new ProcessingException("All alternative banks are congested"));
            routeType = "FALLBACK";
            reason = "Primary bank traffic high, using alternate bank";
        }

        routingRepository.incrementBankLoad(selectedBankCode);

        return new RouteDecision(merchantBankCode, normalizedCustomerBank, selectedBankCode, routeType, reason);
    }

    public void releaseBankLoad(String bankCode) {
        if (bankCode != null && !bankCode.isBlank()) {
            routingRepository.decrementBankLoad(bankCode.toUpperCase());
        }
    }

    public BankRouteHistory saveRoute(BankRouteHistory history) {
        return routingRepository.saveRouteHistory(history);
    }

    public Optional<BankRouteHistory> getLatestRoute(Long paymentId) {
        return routingRepository.findLatestByPaymentId(paymentId);
    }

    public List<BankNode> listActiveBanks() {
        return routingRepository.findAllActiveBanks();
    }

    private boolean isOverloaded(BankNode bankNode) {
        if (bankNode.getMaxCapacity() == null || bankNode.getMaxCapacity() <= 0) {
            return false;
        }
        return bankNode.getCurrentLoad() >= bankNode.getMaxCapacity();
    }

    private boolean isKnownBank(String bankCode) {
        List<String> known = Arrays.asList("HSBC", "HDFC", "ICICI", "SBI", "SIB");
        return known.contains(bankCode);
    }

    private String normalizeNullableBankCode(String bankCode) {
        if (bankCode == null || bankCode.isBlank()) {
            return null;
        }
        return normalizeBankCode(bankCode);
    }

    private String normalizeBankCode(String bankCode) {
        return bankCode.trim().toUpperCase();
    }

    public static class RouteDecision {
        private final String merchantBankCode;
        private final String customerBankCode;
        private final String selectedBankCode;
        private final String routeType;
        private final String reason;

        public RouteDecision(String merchantBankCode,
                             String customerBankCode,
                             String selectedBankCode,
                             String routeType,
                             String reason) {
            this.merchantBankCode = merchantBankCode;
            this.customerBankCode = customerBankCode;
            this.selectedBankCode = selectedBankCode;
            this.routeType = routeType;
            this.reason = reason;
        }

        public String getMerchantBankCode() {
            return merchantBankCode;
        }

        public String getCustomerBankCode() {
            return customerBankCode;
        }

        public String getSelectedBankCode() {
            return selectedBankCode;
        }

        public String getRouteType() {
            return routeType;
        }

        public String getReason() {
            return reason;
        }
    }
}
