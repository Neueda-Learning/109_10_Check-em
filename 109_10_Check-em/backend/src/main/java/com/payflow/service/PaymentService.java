package com.payflow.service;

import com.payflow.dto.CreatePaymentRequest;
import com.payflow.dto.ProcessPaymentRequest;
import com.payflow.dto.ReversePaymentRequest;
import com.payflow.dto.UpdatePaymentRequest;
import com.payflow.dto.UpdateStatusRequest;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import com.payflow.exception.BadRequestException;
import com.payflow.exception.ProcessingException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.model.BankRouteHistory;
import com.payflow.model.BankNode;
import com.payflow.model.CurrencyConversionRecord;
import com.payflow.model.Merchant;
import com.payflow.model.Payment;
import com.payflow.model.PaymentReversal;
import com.payflow.model.PaymentStatusHistory;
import com.payflow.model.User;
import com.payflow.repository.PaymentReversalRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentStatusHistoryRepository;
import com.payflow.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final PaymentStatusHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final MerchantService merchantService;
    private final BankRoutingService bankRoutingService;
    private final CurrencyConversionService currencyConversionService;
    private final DatabaseSchemaService databaseSchemaService;
    private final PaymentReversalRepository paymentReversalRepository;

    @Value("${payflow.routing.seed-enabled:true}")
    private boolean seedRoutingData;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentStatusHistoryRepository historyRepository,
                          UserRepository userRepository,
                          MerchantService merchantService,
                          BankRoutingService bankRoutingService,
                          CurrencyConversionService currencyConversionService,
                          DatabaseSchemaService databaseSchemaService,
                          PaymentReversalRepository paymentReversalRepository) {
        this.paymentRepository = paymentRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.merchantService = merchantService;
        this.bankRoutingService = bankRoutingService;
        this.currencyConversionService = currencyConversionService;
        this.databaseSchemaService = databaseSchemaService;
        this.paymentReversalRepository = paymentReversalRepository;
    }

    @PostConstruct
    public void initRoutingData() {
        try {
            databaseSchemaService.ensureSimulationTables();
            if (seedRoutingData) {
                bankRoutingService.seedDefaultBanks();
            }
        } catch (Exception ex) {
            log.error("Simulation schema bootstrap failed. Application will continue, but routing features may fail until tables are created.", ex);
        }
    }

    public Payment createPayment(CreatePaymentRequest req) {
        validateCreateRequest(req);

        Optional<Payment> existing =
                paymentRepository.findByIdempotencyKey(req.getIdempotencyKey());
        if (existing.isPresent()) {
            return existing.get();
        }

        User customer = userRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found: " + req.getCustomerId()));

        Merchant merchant = merchantService.getByCode(req.getMerchantCode());

        Payment payment = new Payment();
        payment.setIdempotencyKey(req.getIdempotencyKey());
        payment.setCustomer(customer);
        payment.setMerchant(merchant);
        payment.setAmount(req.getAmount());
        payment.setCurrency(req.getCurrency() != null
            ? CurrencyConversionService.normalizeCurrencyCode(req.getCurrency())
            : "INR");
        payment.setPaymentMethod(parsePaymentMethod(req.getPaymentMethod()));
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setDescription(req.getDescription());

        Payment saved = paymentRepository.save(payment);
        logHistory(saved, null, PaymentStatus.INITIATED, "Payment created");
        return saved;
    }

    public Payment processPayment(Long paymentId, ProcessPaymentRequest req) {
        Payment payment = getPayment(paymentId);
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return payment;
        }

        paymentRepository.updateStatus(paymentId, PaymentStatus.PENDING);
        logHistory(payment, payment.getStatus(), PaymentStatus.PENDING, "Payment sent for processing");
        payment.setStatus(PaymentStatus.PENDING);

        boolean highTraffic = req != null && Boolean.TRUE.equals(req.getSimulateHighTraffic());
        boolean insufficientFunds = req != null && Boolean.TRUE.equals(req.getSimulateInsufficientFunds());
        boolean networkError = req != null && Boolean.TRUE.equals(req.getSimulateNetworkError());
        String customerBankCode = req != null ? req.getCustomerBankCode() : null;

        String selectedBankCode = null;
        try {
            BankRoutingService.RouteDecision decision =
                    bankRoutingService.chooseProcessingBank(payment, customerBankCode, highTraffic);
            selectedBankCode = decision.getSelectedBankCode();

            BankRouteHistory routeHistory = new BankRouteHistory();
            routeHistory.setPaymentId(paymentId);
            routeHistory.setMerchantBankCode(decision.getMerchantBankCode());
            routeHistory.setCustomerBankCode(decision.getCustomerBankCode());
            routeHistory.setSelectedBankCode(decision.getSelectedBankCode());
            routeHistory.setRoutingType(decision.getRouteType());
            routeHistory.setRouteStatus("ROUTED");
            routeHistory.setReason(decision.getReason());
            bankRoutingService.saveRoute(routeHistory);

            if (networkError) {
                throw new ProcessingException("Network error from acquiring bank");
            }

            boolean blockOnBalance = requiresBalanceCheck(payment.getCustomer());
            if (blockOnBalance && (insufficientFunds || !userRepository.hasSufficientBalance(payment.getCustomer().getId(), payment.getAmount()))) {
                throw new ProcessingException("Insufficient funds at issuing bank");
            }

            String merchantCurrency = payment.getMerchant().getCurrency();
            CurrencyConversionService.ConversionResult conversion =
                    currencyConversionService.convertAndStore(
                            payment.getId(),
                            payment.getAmount(),
                            payment.getCurrency(),
                            merchantCurrency
                    );

            paymentRepository.updateStatus(paymentId, PaymentStatus.SUCCESS);
            logHistory(payment, PaymentStatus.PENDING, PaymentStatus.SUCCESS,
                    "Processed via " + selectedBankCode +
                    ", converted " + conversion.getSourceCurrency() + "->" + conversion.getTargetCurrency() +
                    " @ " + conversion.getRate());
                userRepository.debitBalance(payment.getCustomer().getId(), payment.getAmount());
            payment.setStatus(PaymentStatus.SUCCESS);
            return payment;
        } catch (ProcessingException ex) {
            paymentRepository.updateStatus(paymentId, PaymentStatus.FAILED);
            logHistory(payment, PaymentStatus.PENDING, PaymentStatus.FAILED, ex.getMessage());
            payment.setStatus(PaymentStatus.FAILED);
            autoReverseOnFailure(payment, ex.getMessage());
            return payment;
        } finally {
            bankRoutingService.releaseBankLoad(selectedBankCode);
        }
    }

    public Payment reversePayment(Long paymentId, ReversePaymentRequest req) {
        Payment payment = getPayment(paymentId);
        if (payment.getStatus() == PaymentStatus.REVERSED) {
            return payment;
        }

        if (payment.getStatus() != PaymentStatus.FAILED) {
            throw new BadRequestException("Manual reversal is allowed only for FAILED payments");
        }

        String reason = req != null && req.getReason() != null && !req.getReason().isBlank()
                ? req.getReason()
                : "Manual reversal requested";
        String initiatedBy = req != null && req.getInitiatedBy() != null && !req.getInitiatedBy().isBlank()
                ? req.getInitiatedBy()
                : "SYSTEM";

        PaymentReversal reversal = new PaymentReversal();
        reversal.setPaymentId(paymentId);
        reversal.setAmount(payment.getAmount());
        reversal.setReason(reason);
        reversal.setInitiatedBy(initiatedBy);
        reversal.setReversalStatus("COMPLETED");
        paymentReversalRepository.save(reversal);

        paymentRepository.updateStatus(paymentId, PaymentStatus.REVERSED);
        logHistory(payment, payment.getStatus(), PaymentStatus.REVERSED, reason);
        payment.setStatus(PaymentStatus.REVERSED);
        return payment;
    }

    public List<PaymentReversal> getReversals(Long paymentId) {
        getPayment(paymentId);
        return paymentReversalRepository.findByPaymentId(paymentId);
    }

    public boolean hasSufficientCustomerBalance(Long paymentId) {
        Payment payment = getPayment(paymentId);
        if (!requiresBalanceCheck(payment.getCustomer())) {
            return true;
        }
        return userRepository.hasSufficientBalance(payment.getCustomer().getId(), payment.getAmount());
    }

    public Payment updatePayment(Long id, UpdatePaymentRequest req) {
        Payment existing = getPayment(id);
        int rows = paymentRepository.updateDescription(id, req.getDescription());
        if (rows == 0) {
            throw new ProcessingException("Update failed for payment: " + id);
        }
        existing.setDescription(req.getDescription());
        return existing;
    }

    public void deletePayment(Long id) {
        getPayment(id);
        paymentRepository.deleteById(id);
    }

    public Payment updateStatus(Long id, UpdateStatusRequest req) {
        Payment payment = getPayment(id);
        PaymentStatus oldStatus = payment.getStatus();
        PaymentStatus newStatus = parsePaymentStatus(req.getStatus());
        paymentRepository.updateStatus(id, newStatus);
        payment.setStatus(newStatus);
        logHistory(payment, oldStatus, newStatus, req.getReason());
        return payment;
    }

    public Payment getPayment(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    public List<Payment> getByCustomer(Long customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    public List<Payment> getByMerchant(Long merchantId) {
        return paymentRepository.findByMerchantId(merchantId);
    }

    public List<Payment> getByMerchantCode(String merchantCode) {
        Merchant merchant = merchantService.getByCode(merchantCode);
        return paymentRepository.findByMerchantId(merchant.getId());
    }

    public List<BankNode> listRoutingBanks() {
        return bankRoutingService.listActiveBanks();
    }

    public List<PaymentStatusHistory> getHistory(Long paymentId) {
        getPayment(paymentId);
        return historyRepository.findByPaymentIdOrderByChangedAtAsc(paymentId);
    }

    public List<Payment> searchPayments(Long customerId,
                                        Long merchantId,
                                        String status,
                                        String paymentMethod,
                                        String currency,
                                        String fromDate,
                                        String toDate,
                                        Integer limit,
                                        Integer offset) {
        String normalizedStatus = status == null || status.isBlank() ? null : parsePaymentStatus(status).name();
        String normalizedMethod = paymentMethod == null || paymentMethod.isBlank()
                ? null
                : parsePaymentMethod(paymentMethod).name();
        String normalizedCurrency = currency == null || currency.isBlank() ? null : currency.trim().toUpperCase();

        LocalDateTime fromDateTime = parseDateTime(fromDate, "fromDate");
        LocalDateTime toDateTime = parseDateTime(toDate, "toDate");

        return paymentRepository.searchPayments(
                customerId,
                merchantId,
                normalizedStatus,
                normalizedMethod,
                normalizedCurrency,
                fromDateTime,
                toDateTime,
                limit,
                offset
        );
    }

    public void configureMerchantBank(String merchantCode, String bankCode) {
        if (bankCode == null || bankCode.isBlank()) {
            throw new BadRequestException("bankCode is required");
        }
        Merchant merchant = merchantService.getByCode(merchantCode);
        bankRoutingService.ensureMerchantBankMapping(merchant, bankCode);
    }

    public BankRouteHistory getLatestRoute(Long paymentId) {
        getPayment(paymentId);
        return bankRoutingService.getLatestRoute(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("No route history for payment: " + paymentId));
    }

    public CurrencyConversionRecord getLatestConversion(Long paymentId) {
        getPayment(paymentId);
        CurrencyConversionRecord record = currencyConversionService.getLatestForPayment(paymentId);
        if (record == null) {
            throw new ResourceNotFoundException("No conversion record for payment: " + paymentId);
        }
        return record;
    }

    private void logHistory(Payment payment, PaymentStatus oldStatus,
                            PaymentStatus newStatus, String reason) {
        PaymentStatusHistory history = new PaymentStatusHistory();
        history.setPayment(payment);
        history.setOldStatus(oldStatus != null ? oldStatus.name() : null);
        history.setNewStatus(newStatus.name());
        history.setReason(reason);
        historyRepository.save(history);
    }

    private void autoReverseOnFailure(Payment payment, String reason) {
        PaymentReversal reversal = new PaymentReversal();
        reversal.setPaymentId(payment.getId());
        reversal.setAmount(payment.getAmount());
        reversal.setReason("Auto reversal after processing failure: " + reason);
        reversal.setInitiatedBy("SYSTEM");
        reversal.setReversalStatus("COMPLETED");
        paymentReversalRepository.save(reversal);

        paymentRepository.updateStatus(payment.getId(), PaymentStatus.REVERSED);
        logHistory(payment, PaymentStatus.FAILED, PaymentStatus.REVERSED,
                "Auto-reversed after failure");
        payment.setStatus(PaymentStatus.REVERSED);
    }

    private void validateCreateRequest(CreatePaymentRequest req) {
        List<String> errors = new ArrayList<>();
        if (req == null) {
            throw new BadRequestException("Request body is required");
        }
        if (req.getIdempotencyKey() == null || req.getIdempotencyKey().isBlank()) {
            errors.add("idempotencyKey is required");
        }
        if (req.getCustomerId() == null) {
            errors.add("customerId is required");
        }
        if (req.getMerchantCode() == null || req.getMerchantCode().isBlank()) {
            errors.add("merchantCode is required");
        }
        if (req.getAmount() == null || req.getAmount().signum() <= 0) {
            errors.add("amount must be greater than 0");
        }
        if (req.getPaymentMethod() == null || req.getPaymentMethod().isBlank()) {
            errors.add("paymentMethod is required");
        }
        if (!errors.isEmpty()) {
            throw new BadRequestException(String.join(", ", errors));
        }
    }

    private boolean requiresBalanceCheck(User customer) {
        if (customer == null || customer.getName() == null) {
            return false;
        }
        return "aarav sharma".equalsIgnoreCase(customer.getName().trim());
    }

    private PaymentMethod parsePaymentMethod(String rawMethod) {
        if (rawMethod == null || rawMethod.isBlank()) {
            throw new BadRequestException("paymentMethod is required");
        }
        String normalized = rawMethod.trim().toUpperCase();
        if ("NET_BANKING".equals(normalized)) {
            normalized = "BANK_TRANSFER";
        }
        try {
            return PaymentMethod.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported payment method: " + rawMethod +
                    ". Supported methods: CARD, UPI, NET_BANKING, BANK_TRANSFER, WALLET");
        }
    }

    private PaymentStatus parsePaymentStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new BadRequestException("status is required");
        }
        try {
            return PaymentStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported status: " + rawStatus);
        }
    }

    private LocalDateTime parseDateTime(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Invalid " + fieldName + " format. Use ISO-8601, e.g. 2026-08-04T10:15:30");
        }
    }
}