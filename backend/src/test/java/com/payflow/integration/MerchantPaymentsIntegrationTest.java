package com.payflow.integration;

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
class MerchantPaymentsIntegrationTest {

    @LocalServerPort
    private int port;

    @Test
    void merchantPaymentsEndpoint_returnsSeededPaymentsForHm() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(new URI("http://localhost:" + port + "/api/payments/merchant/HM001"))
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("\"idempotencyKey\":\"idem_hm_alice_001\""));
        assertTrue(response.body().contains("\"customer\""));
        assertTrue(response.body().contains("\"status\""));
        assertTrue(response.body().contains("\"paymentMethod\""));
    }
}
