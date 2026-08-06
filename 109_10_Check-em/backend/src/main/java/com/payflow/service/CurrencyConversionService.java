package com.payflow.service;

import com.payflow.exception.ProcessingException;
import com.payflow.model.CurrencyConversionRecord;
import com.payflow.repository.CurrencyConversionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class CurrencyConversionService {

    private static final Map<String, String> CURRENCY_ALIASES = buildCurrencyAliases();

    private final RestTemplate restTemplate;
    private final CurrencyConversionRepository repository;

    @Value("${payflow.fx.api-url:https://api.exchangerate.host/latest}")
    private String fxApiUrl;

    public CurrencyConversionService(RestTemplate restTemplate,
                                     CurrencyConversionRepository repository) {
        this.restTemplate = restTemplate;
        this.repository = repository;
    }

    public ConversionResult convertAndStore(Long paymentId,
                                            BigDecimal amount,
                                            String fromCurrency,
                                            String toCurrency) {
        String source = normalizeCurrencyCode(fromCurrency);
        String target = normalizeCurrencyCode(toCurrency);

        if (source.equals(target)) {
            CurrencyConversionRecord record = new CurrencyConversionRecord();
            record.setPaymentId(paymentId);
            record.setSourceCurrency(source);
            record.setTargetCurrency(target);
            record.setSourceAmount(amount);
            record.setConvertedAmount(amount);
            record.setRate(BigDecimal.ONE);
            repository.save(record);
            return new ConversionResult(amount, BigDecimal.ONE, source, target);
        }

        BigDecimal rate = fetchRate(source, target);
        BigDecimal converted = amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);

        CurrencyConversionRecord record = new CurrencyConversionRecord();
        record.setPaymentId(paymentId);
        record.setSourceCurrency(source);
        record.setTargetCurrency(target);
        record.setSourceAmount(amount);
        record.setConvertedAmount(converted);
        record.setRate(rate);
        repository.save(record);

        return new ConversionResult(converted, rate, source, target);
    }

    public CurrencyConversionRecord getLatestForPayment(Long paymentId) {
        return repository.findLatestByPaymentId(paymentId).orElse(null);
    }

    private BigDecimal fetchRate(String source, String target) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    fxApiUrl + "?base=" + source + "&symbols=" + target,
                    Map.class);
            if (response.getBody() != null) {
                Object ratesObj = response.getBody().get("rates");
                if (ratesObj instanceof Map<?, ?> ratesMap && ratesMap.containsKey(target)) {
                    BigDecimal rate = new BigDecimal(ratesMap.get(target).toString());
                    repository.upsertCachedRate(source, target, rate);
                    return rate;
                }
            }
        } catch (RestClientException | NumberFormatException ignored) {
            // Falls back to cache/default values below.
        }

        return repository.findCachedRate(source, target)
                .orElseGet(() -> fallbackRate(source, target));
    }

    private BigDecimal fallbackRate(String source, String target) {
        // Compute via INR pivot for known currencies to avoid unnecessary reversals
        // when direct pairs are not available in API/cache.
        BigDecimal viaInr = fallbackViaInr(source, target);
        if (viaInr != null) {
            return viaInr;
        }

        if ("INR".equals(source) && "USD".equals(target)) {
            return new BigDecimal("0.012");
        }
        if ("USD".equals(source) && "INR".equals(target)) {
            return new BigDecimal("83.00");
        }
        if ("INR".equals(source) && "AED".equals(target)) {
            return new BigDecimal("0.044");
        }
        if ("AED".equals(source) && "INR".equals(target)) {
            return new BigDecimal("22.70");
        }
        if ("USD".equals(source) && "AED".equals(target)) {
            return new BigDecimal("3.67");
        }
        if ("AED".equals(source) && "USD".equals(target)) {
            return new BigDecimal("0.27");
        }
        throw new ProcessingException("Unable to convert unsupported currency pair: " + source + " to " + target);
    }

    private BigDecimal fallbackViaInr(String source, String target) {
        Map<String, BigDecimal> rateFromInr = Map.of(
                "INR", BigDecimal.ONE,
                "USD", new BigDecimal("0.012"),
                "EUR", new BigDecimal("0.011"),
                "GBP", new BigDecimal("0.0094"),
                "AED", new BigDecimal("0.044")
        );
        BigDecimal sourceFromInr = rateFromInr.get(source);
        BigDecimal targetFromInr = rateFromInr.get(target);
        if (sourceFromInr == null || targetFromInr == null) {
            return null;
        }
        if (sourceFromInr.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return targetFromInr.divide(sourceFromInr, 8, RoundingMode.HALF_UP);
    }

    public static String normalizeCurrencyCode(String currency) {
        if (currency == null || currency.isBlank()) {
            throw new ProcessingException("Currency must be provided for processing");
        }
        String raw = currency.trim().toUpperCase();
        String normalized = CURRENCY_ALIASES.get(raw);
        if (normalized == null) {
            throw new ProcessingException("Unsupported currency value: " + currency);
        }
        return normalized;
    }

    private static Map<String, String> buildCurrencyAliases() {
        Map<String, String> aliases = new HashMap<>();

        aliases.put("INR", "INR");
        aliases.put("RUPEE", "INR");
        aliases.put("RUPEES", "INR");
        aliases.put("INDIAN RUPEE", "INR");
        aliases.put("INDIAN RUPEES", "INR");
        aliases.put("₹", "INR");

        aliases.put("USD", "USD");
        aliases.put("US DOLLAR", "USD");
        aliases.put("US DOLLARS", "USD");
        aliases.put("DOLLAR", "USD");
        aliases.put("DOLLARS", "USD");
        aliases.put("$", "USD");

        aliases.put("EUR", "EUR");
        aliases.put("EURO", "EUR");
        aliases.put("EUROS", "EUR");
        aliases.put("€", "EUR");

        aliases.put("GBP", "GBP");
        aliases.put("POUND", "GBP");
        aliases.put("POUNDS", "GBP");
        aliases.put("POUND STERLING", "GBP");
        aliases.put("£", "GBP");

        aliases.put("AED", "AED");
        aliases.put("DIRHAM", "AED");
        aliases.put("DIRHAMS", "AED");
        aliases.put("UAE DIRHAM", "AED");

        return aliases;
    }

    public static class ConversionResult {
        private final BigDecimal convertedAmount;
        private final BigDecimal rate;
        private final String sourceCurrency;
        private final String targetCurrency;

        public ConversionResult(BigDecimal convertedAmount,
                                BigDecimal rate,
                                String sourceCurrency,
                                String targetCurrency) {
            this.convertedAmount = convertedAmount;
            this.rate = rate;
            this.sourceCurrency = sourceCurrency;
            this.targetCurrency = targetCurrency;
        }

        public BigDecimal getConvertedAmount() {
            return convertedAmount;
        }

        public BigDecimal getRate() {
            return rate;
        }

        public String getSourceCurrency() {
            return sourceCurrency;
        }

        public String getTargetCurrency() {
            return targetCurrency;
        }
    }
}
