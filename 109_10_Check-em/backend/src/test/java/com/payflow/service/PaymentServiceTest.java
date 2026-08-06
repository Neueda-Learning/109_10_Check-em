package com.payflow.service;

import com.payflow.dto.CreatePaymentRequest;
import com.payflow.dto.ProcessPaymentRequest;
import com.payflow.dto.ReversePaymentRequest;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import com.payflow.exception.BadRequestException;
import com.payflow.model.Merchant;
import com.payflow.model.Payment;
import com.payflow.model.User;
import com.payflow.repository.BankRoutingRepository;
import com.payflow.repository.PaymentReversalRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentStatusHistoryRepository;
import com.payflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentStatusHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MerchantService merchantService;
    @Mock
    private BankRoutingService bankRoutingService;
    @Mock
    private CurrencyConversionService currencyConversionService;
    @Mock
    private BankRoutingRepository bankRoutingRepository;
    @Mock
    private DatabaseSchemaService databaseSchemaService;
    @Mock
    private PaymentReversalRepository paymentReversalRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                historyRepository,
                userRepository,
                merchantService,
                bankRoutingService,
                currencyConversionService,
                databaseSchemaService,
                paymentReversalRepository
        );
    }

    @Test
    void createPayment_invalidMethod_shouldThrowBadRequest() {
        CreatePaymentRequest req = new CreatePaymentRequest();
        req.setIdempotencyKey("unit-" + UUID.randomUUID());
        req.setCustomerId(2L);
        req.setMerchantCode("HM001");
        req.setAmount(new BigDecimal("10.00"));
        req.setCurrency("INR");
        req.setPaymentMethod("CRYPTO");

        when(paymentRepository.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleUser()));
        when(merchantService.getByCode("HM001")).thenReturn(sampleMerchant());

        assertThrows(BadRequestException.class, () -> paymentService.createPayment(req));
    }

    @Test
    void processPayment_success_shouldSetSuccess() {
        Payment payment = samplePayment(PaymentStatus.INITIATED, new BigDecimal("10.00"), "USD");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        BankRoutingService.RouteDecision route = new BankRoutingService.RouteDecision(
                "HSBC", "HDFC", "HSBC", "INTER_BANK", "Inter-bank routing applied"
        );
        when(bankRoutingService.chooseProcessingBank(any(Payment.class), eq("HDFC"), eq(false))).thenReturn(route);

        CurrencyConversionService.ConversionResult conversion = new CurrencyConversionService.ConversionResult(
                new BigDecimal("830.00"), new BigDecimal("83.00"), "USD", "INR"
        );
        when(currencyConversionService.convertAndStore(eq(1L), any(BigDecimal.class), eq("USD"), eq("INR")))
                .thenReturn(conversion);
        when(userRepository.debitBalance(2L, new BigDecimal("10.00"))).thenReturn(1);

        ProcessPaymentRequest req = new ProcessPaymentRequest();
        req.setCustomerBankCode("HDFC");

        Payment result = paymentService.processPayment(1L, req);

        assertEquals(PaymentStatus.SUCCESS, result.getStatus());
        verify(paymentRepository).updateStatus(1L, PaymentStatus.SUCCESS);
        verify(userRepository).debitBalance(2L, new BigDecimal("10.00"));
    }

        @Test
        void processPayment_nonAaravCustomer_shouldSkipBalanceFailure() {
        Payment payment = samplePayment(PaymentStatus.INITIATED, new BigDecimal("25.00"), "INR");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        BankRoutingService.RouteDecision route = new BankRoutingService.RouteDecision(
            "HSBC", "ICICI", "HSBC", "INTER_BANK", "Inter-bank routing applied"
        );
        when(bankRoutingService.chooseProcessingBank(any(Payment.class), eq("ICICI"), eq(false))).thenReturn(route);

        CurrencyConversionService.ConversionResult conversion = new CurrencyConversionService.ConversionResult(
            new BigDecimal("25.00"), new BigDecimal("25.00"), "INR", "INR"
        );
        when(currencyConversionService.convertAndStore(eq(1L), any(BigDecimal.class), eq("INR"), eq("INR")))
            .thenReturn(conversion);
        when(userRepository.debitBalance(2L, new BigDecimal("25.00"))).thenReturn(0);

        ProcessPaymentRequest req = new ProcessPaymentRequest();
        req.setCustomerBankCode("ICICI");
        req.setSimulateInsufficientFunds(true);

        Payment result = paymentService.processPayment(1L, req);

        assertEquals(PaymentStatus.SUCCESS, result.getStatus());
        verify(paymentRepository).updateStatus(1L, PaymentStatus.SUCCESS);
        }

        @Test
        void processPayment_aaravCustomer_shouldStillFailOnInsufficientBalance() {
        Payment payment = samplePayment(PaymentStatus.INITIATED, new BigDecimal("25.00"), "INR");
        payment.getCustomer().setName("Aarav Sharma");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        BankRoutingService.RouteDecision route = new BankRoutingService.RouteDecision(
            "HSBC", "ICICI", "HSBC", "INTER_BANK", "Inter-bank routing applied"
        );
        when(bankRoutingService.chooseProcessingBank(any(Payment.class), eq("ICICI"), eq(false))).thenReturn(route);
        when(userRepository.hasSufficientBalance(2L, new BigDecimal("25.00"))).thenReturn(false);

        ProcessPaymentRequest req = new ProcessPaymentRequest();
        req.setCustomerBankCode("ICICI");

        Payment result = paymentService.processPayment(1L, req);

        assertEquals(PaymentStatus.REVERSED, result.getStatus());
        verify(paymentRepository).updateStatus(1L, PaymentStatus.REVERSED);
        }

    @Test
    void processPayment_insufficientFunds_shouldAutoReverse() {
        Payment payment = samplePayment(PaymentStatus.INITIATED, new BigDecimal("25.00"), "INR");
        payment.getCustomer().setName("Aarav Sharma");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        BankRoutingService.RouteDecision route = new BankRoutingService.RouteDecision(
                "HSBC", "ICICI", "HSBC", "INTER_BANK", "Inter-bank routing applied"
        );
        when(bankRoutingService.chooseProcessingBank(any(Payment.class), eq("ICICI"), eq(false))).thenReturn(route);

        ProcessPaymentRequest req = new ProcessPaymentRequest();
        req.setCustomerBankCode("ICICI");
        req.setSimulateInsufficientFunds(true);

        Payment result = paymentService.processPayment(1L, req);

        assertEquals(PaymentStatus.REVERSED, result.getStatus());
        verify(paymentReversalRepository).save(any());
        verify(paymentRepository).updateStatus(1L, PaymentStatus.REVERSED);
    }

    @Test
    void reversePayment_initiated_shouldThrowBadRequest() {
        Payment payment = samplePayment(PaymentStatus.INITIATED, new BigDecimal("40.00"), "INR");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));

        ReversePaymentRequest req = new ReversePaymentRequest();
        req.setReason("manual");

        assertThrows(BadRequestException.class, () -> paymentService.reversePayment(1L, req));
    }

    private Payment samplePayment(PaymentStatus status, BigDecimal amount, String currency) {
        Payment payment = new Payment();
        payment.setId(1L);
        payment.setIdempotencyKey("key-1");
        payment.setCustomer(sampleUser());
        payment.setMerchant(sampleMerchant());
        payment.setAmount(amount);
        payment.setCurrency(currency);
        payment.setPaymentMethod(PaymentMethod.UPI);
        payment.setStatus(status);
        payment.setDescription("sample");
        return payment;
    }

    private User sampleUser() {
        User user = new User();
        user.setId(2L);
        user.setName("Alice");
        user.setEmail("alice@demo.com");
        return user;
    }

    private Merchant sampleMerchant() {
        Merchant merchant = new Merchant();
        merchant.setId(1L);
        merchant.setMerchantCode("HM001");
        merchant.setBusinessName("H&M Retail");
        merchant.setCurrency("INR");
        return merchant;
    }
}
