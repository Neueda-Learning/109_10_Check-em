package com.payflow.service;

import com.payflow.model.CurrencyConversionRecord;
import com.payflow.repository.CurrencyConversionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrencyConversionServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private CurrencyConversionRepository repository;

    @InjectMocks
    private CurrencyConversionService currencyConversionService;

    @Test
    void convertAndStore_inrToGbp_usesFallbackViaInr() {
        ReflectionTestUtils.setField(currencyConversionService, "fxApiUrl", "http://fx.example/latest");

        when(restTemplate.getForEntity(anyString(), any(Class.class)))
                .thenThrow(new RestClientException("offline"));
        when(repository.findCachedRate("INR", "GBP")).thenReturn(Optional.empty());
        when(repository.save(any(CurrencyConversionRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CurrencyConversionService.ConversionResult result = currencyConversionService.convertAndStore(
                101L,
                new BigDecimal("100.00"),
                "inr",
                "pound"
        );

        assertEquals("INR", result.getSourceCurrency());
        assertEquals("GBP", result.getTargetCurrency());
        assertEquals(new BigDecimal("0.00940000"), result.getRate());
        assertEquals(new BigDecimal("0.94"), result.getConvertedAmount());

        ArgumentCaptor<CurrencyConversionRecord> captor = ArgumentCaptor.forClass(CurrencyConversionRecord.class);
        verify(repository).save(captor.capture());
        assertEquals("GBP", captor.getValue().getTargetCurrency());
    }

    @Test
    void convertAndStore_usesAliasDollarToUsd() {
        ReflectionTestUtils.setField(currencyConversionService, "fxApiUrl", "http://fx.example/latest");

        when(restTemplate.getForEntity(anyString(), any(Class.class)))
                .thenReturn(ResponseEntity.ok(Map.of("rates", Map.of("USD", 0.012))));
        when(repository.save(any(CurrencyConversionRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CurrencyConversionService.ConversionResult result = currencyConversionService.convertAndStore(
                102L,
                new BigDecimal("1000.00"),
                "rupees",
                "dollar"
        );

        assertEquals("INR", result.getSourceCurrency());
        assertEquals("USD", result.getTargetCurrency());
        assertEquals(new BigDecimal("12.00"), result.getConvertedAmount());
    }
}
