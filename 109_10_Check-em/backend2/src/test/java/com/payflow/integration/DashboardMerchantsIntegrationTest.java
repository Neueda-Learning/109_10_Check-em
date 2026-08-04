package com.payflow.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DashboardMerchantsIntegrationTest {

    @LocalServerPort
    private int port;

    @Test
    void dashboardEndpoint_returnsFeaturedRetailersWithValidData() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(new URI("http://localhost:" + port + "/api/merchants/dashboard"))
            .GET()
            .build();
        HttpResponse<String> responseHttp = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertTrue(responseHttp.statusCode() == 200);
        String json = responseHttp.body();
        assertTrue(json.contains("\"merchantCode\":\"HM001\""));
        assertTrue(json.contains("\"merchantCode\":\"IND001\""));
        assertTrue(json.contains("\"merchantCode\":\"HIL001\""));
        assertTrue(json.contains("\"businessName\":"));
        assertTrue(json.contains("\"logoUrl\":"));
        assertTrue(json.contains("\"currency\":"));
        assertTrue(json.contains("\"primaryBankCode\":"));
        assertTrue(json.contains("\"totalPayments\":"));
        assertTrue(json.contains("\"totalProcessedAmount\":"));
    }
}
