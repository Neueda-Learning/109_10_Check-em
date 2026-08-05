package com.payflow.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PaymentMandateIntegrationTest {

        @LocalServerPort
        private int port;

        private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void paymentWithCurrencyConversion_andMandateLifecycle_workEndToEnd() throws Exception {
                HttpClient client = HttpClient.newHttpClient();

        String paymentCreateBody = """
                {
                  "idempotencyKey": "intg-flow-001",
                  "customerId": 2,
                  "merchantCode": "HM001",
                  "amount": 2500.00,
                  "currency": "INR",
                  "paymentMethod": "CARD",
                  "description": "Integration flow checkout"
                }
                """;

        String createPaymentResponse = sendJson(client, "/api/payments", "POST", paymentCreateBody, 200);

        long paymentId = objectMapper.readTree(createPaymentResponse).path("id").asLong();
        assertTrue(paymentId > 0);

        String processBody = """
                {
                  "customerBankCode": "HDFC",
                  "simulateHighTraffic": false,
                  "simulateInsufficientFunds": false,
                  "simulateNetworkError": false
                }
                """;

        String processResponse = sendJson(client, "/api/payments/" + paymentId + "/process", "POST", processBody, 200);

        JsonNode processJson = objectMapper.readTree(processResponse);
        assertEquals("SUCCESS", processJson.path("status").asText());

        String conversionResponse = sendJson(client, "/api/payments/" + paymentId + "/conversion", "GET", null, 200);

        JsonNode conversionJson = objectMapper.readTree(conversionResponse);
        assertEquals("INR", conversionJson.path("sourceCurrency").asText());
        assertEquals("USD", conversionJson.path("targetCurrency").asText());
        assertTrue(conversionJson.path("rate").asDouble() > 0.0);

        String createMandateBody = """
                {
                  "label": "H&M Monthly Cart",
                  "merchantCode": "HM001",
                  "customerId": 2,
                  "paymentMethod": "CARD",
                  "otp": "123456",
                  "cardNumber": "4242424242424242",
                  "cardHolderName": "Aarav Sharma",
                  "cardExpiry": "08/29",
                  "debitAmount": 1200.00,
                  "maxAmount": 5000.00,
                  "currency": "INR",
                  "frequency": "MONTHLY"
                }
                """;

        String createMandateResponse = sendJson(client, "/api/mandates", "POST", createMandateBody, 200);

        long mandateId = objectMapper.readTree(createMandateResponse).path("id").asLong();
        assertTrue(mandateId > 0);

        String pauseBody = """
                {
                  "status": "PAUSED",
                  "otp": "123456"
                }
                """;

        String pauseResponse = sendJson(client, "/api/mandates/" + mandateId + "/status", "PATCH", pauseBody, 200);

        assertEquals("PAUSED", objectMapper.readTree(pauseResponse).path("status").asText());

        sendJson(client, "/api/mandates/" + mandateId, "DELETE", "{\"otp\":\"123456\"}", 200);
    }

    private String sendJson(HttpClient client,
                            String path,
                            String method,
                            String body,
                            int expectedStatus) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(new URI("http://localhost:" + port + path));

        if (body != null) {
            builder.header("Content-Type", "application/json");
            builder.method(method, HttpRequest.BodyPublishers.ofString(body));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }

        HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(expectedStatus, response.statusCode(), response.body());
        return response.body();
    }
}
