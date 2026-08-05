package com.payflow.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class DatabaseSchemaService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void ensureSimulationTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS bank_nodes (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    bank_code VARCHAR(20) NOT NULL,
                    bank_name VARCHAR(120) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    current_load INT NOT NULL DEFAULT 0,
                    max_capacity INT NOT NULL,
                    priority_weight INT NOT NULL DEFAULT 50,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uq_bank_nodes_code (bank_code)
                ) ENGINE=InnoDB
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS merchant_bank_routes (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    merchant_id BIGINT NOT NULL,
                    preferred_bank_code VARCHAR(20) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uq_merchant_route (merchant_id),
                    CONSTRAINT fk_merchant_bank_route_merchant
                        FOREIGN KEY (merchant_id) REFERENCES merchants(id),
                    CONSTRAINT fk_merchant_bank_route_bank
                        FOREIGN KEY (preferred_bank_code) REFERENCES bank_nodes(bank_code)
                ) ENGINE=InnoDB
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS bank_route_history (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    payment_id BIGINT NOT NULL,
                    merchant_bank_code VARCHAR(20) NULL,
                    customer_bank_code VARCHAR(20) NULL,
                    selected_bank_code VARCHAR(20) NOT NULL,
                    routing_type VARCHAR(30) NOT NULL,
                    route_status VARCHAR(30) NOT NULL,
                    reason VARCHAR(255) NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY idx_bank_route_payment (payment_id),
                    CONSTRAINT fk_route_history_payment
                        FOREIGN KEY (payment_id) REFERENCES payments(id),
                    CONSTRAINT fk_route_history_selected_bank
                        FOREIGN KEY (selected_bank_code) REFERENCES bank_nodes(bank_code)
                ) ENGINE=InnoDB
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS currency_rate_cache (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    source_currency VARCHAR(10) NOT NULL,
                    target_currency VARCHAR(10) NOT NULL,
                    rate DECIMAL(18,8) NOT NULL,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uq_currency_pair (source_currency, target_currency)
                ) ENGINE=InnoDB
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS payment_currency_conversions (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    payment_id BIGINT NOT NULL,
                    source_currency VARCHAR(10) NOT NULL,
                    target_currency VARCHAR(10) NOT NULL,
                    source_amount DECIMAL(12,2) NOT NULL,
                    converted_amount DECIMAL(12,2) NOT NULL,
                    rate DECIMAL(18,8) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY idx_conv_payment (payment_id),
                    CONSTRAINT fk_payment_conversion_payment
                        FOREIGN KEY (payment_id) REFERENCES payments(id)
                ) ENGINE=InnoDB
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS payment_reversals (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    payment_id BIGINT NOT NULL,
                    amount DECIMAL(12,2) NOT NULL,
                    reason VARCHAR(255) NULL,
                    initiated_by VARCHAR(120) NULL,
                    reversal_status VARCHAR(30) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY idx_reversal_payment (payment_id),
                    CONSTRAINT fk_reversal_payment
                        FOREIGN KEY (payment_id) REFERENCES payments(id)
                ) ENGINE=InnoDB
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS autopay_mandates (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    label VARCHAR(255) NOT NULL,
                    merchant_code VARCHAR(50) NOT NULL,
                    customer_id BIGINT NOT NULL,
                    payment_method VARCHAR(30) NOT NULL,
                    instrument_type VARCHAR(30) NOT NULL,
                    card_number_masked VARCHAR(32) NULL,
                    card_holder_name VARCHAR(120) NULL,
                    upi_id VARCHAR(120) NULL,
                    bank_account_masked VARCHAR(32) NULL,
                    bank_ifsc VARCHAR(20) NULL,
                    debit_amount DECIMAL(12,2) NOT NULL,
                    max_amount DECIMAL(12,2) NOT NULL,
                    currency VARCHAR(10) NOT NULL,
                    frequency VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY idx_mandate_merchant_code (merchant_code)
                ) ENGINE=InnoDB
                """);

        ensureDemoCompanies();
            ensureRoutingSeedData();
            ensureDemoPayments();
    }

    private void ensureDemoCompanies() {
        createUserIfMissing("H&M Store", "store@hm.com", "+919100000001", "MERCHANT");
        createUserIfMissing("Max Store", "store@max.com", "+919100000002", "MERCHANT");
        createUserIfMissing("Indigo Store", "store@indigo.com", "+919100000003", "MERCHANT");
        createUserIfMissing("Hilton Store", "store@hilton.com", "+919100000004", "MERCHANT");

            createUserIfMissing("Alice Johnson", "alice@demo.com", "+447700900001", "CUSTOMER");
            createUserIfMissing("Bob Smith", "bob@demo.com", "+14155550102", "CUSTOMER");
            createUserIfMissing("Chris Patel", "chris@demo.com", "+919876543210", "CUSTOMER");
            createUserIfMissing("Fatima Noor", "fatima@demo.com", "+971501234567", "CUSTOMER");
            createUserIfMissing("Liam Walker", "liam@demo.com", "+61412345678", "CUSTOMER");

        createMerchantIfMissing("store@hm.com", "H&M Retail", "HM001", "INR");
        createMerchantIfMissing("store@max.com", "Max Fashion", "MAX001", "INR");
        createMerchantIfMissing("store@indigo.com", "Indigo Airlines", "IND001", "INR");
        createMerchantIfMissing("store@hilton.com", "Hilton Hotels", "HIL001", "USD");
    }

            private void ensureRoutingSeedData() {
            jdbcTemplate.update(
                """
                INSERT INTO bank_nodes (bank_code, bank_name, is_active, current_load, max_capacity, priority_weight)
                VALUES
                ('HSBC', 'HSBC Bank India', TRUE, 0, 120, 90),
                ('HDFC', 'HDFC Bank', TRUE, 0, 150, 95),
                ('ICICI', 'ICICI Bank', TRUE, 0, 140, 92),
                ('SBI', 'State Bank of India', TRUE, 0, 300, 100),
                ('SIB', 'South Indian Bank', TRUE, 0, 100, 80)
                ON DUPLICATE KEY UPDATE
                    bank_name = VALUES(bank_name),
                    is_active = VALUES(is_active),
                    max_capacity = VALUES(max_capacity),
                    priority_weight = VALUES(priority_weight)
                """
            );

            upsertMerchantRoute("HM001", "HSBC");
            upsertMerchantRoute("MAX001", "HDFC");
            upsertMerchantRoute("IND001", "ICICI");
            upsertMerchantRoute("HIL001", "SBI");

            jdbcTemplate.update(
                """
                INSERT INTO currency_rate_cache (source_currency, target_currency, rate, updated_at)
                VALUES
                ('INR', 'USD', 0.01200000, NOW()),
                ('USD', 'INR', 83.00000000, NOW()),
                ('INR', 'AED', 0.04400000, NOW()),
                ('AED', 'INR', 22.70000000, NOW()),
                ('USD', 'AED', 3.67000000, NOW()),
                ('AED', 'USD', 0.27000000, NOW())
                ON DUPLICATE KEY UPDATE
                    rate = VALUES(rate),
                    updated_at = VALUES(updated_at)
                """
            );
            }

            private void ensureDemoPayments() {
            Long p1 = createPaymentIfMissing(
                "idem_hm_alice_001", "alice@demo.com", "HM001", new BigDecimal("49.99"),
                "INR", "CARD", "SUCCESS", "H&M jacket purchase"
            );
            insertHistoryIfMissing(p1, null, "INITIATED", "Payment created");
            insertHistoryIfMissing(p1, "INITIATED", "PENDING", "Sent to acquiring bank");
            insertHistoryIfMissing(p1, "PENDING", "SUCCESS", "Approved by issuing bank");
            insertRouteIfMissing(p1, "HSBC", "HDFC", "HSBC", "STATIC", "ROUTED", "Preferred merchant route");
            insertConversionIfMissing(p1, "INR", "INR", new BigDecimal("49.99"), new BigDecimal("49.99"), new BigDecimal("1.00000000"));

            Long p2 = createPaymentIfMissing(
                "idem_hm_bob_001", "bob@demo.com", "HM001", new BigDecimal("12.50"),
                "INR", "WALLET", "PENDING", "H&M accessories"
            );
            insertHistoryIfMissing(p2, null, "INITIATED", "Payment created");
            insertHistoryIfMissing(p2, "INITIATED", "PENDING", "Awaiting wallet confirmation");
            insertRouteIfMissing(p2, "HSBC", "SBI", "HDFC", "DYNAMIC", "ROUTED", "Load balancing under congestion");

            Long p3 = createPaymentIfMissing(
                "idem_hm_chris_001", "chris@demo.com", "HM001", new BigDecimal("89.00"),
                "INR", "BANK_TRANSFER", "REVERSED", "H&M coat purchase"
            );
            insertHistoryIfMissing(p3, null, "INITIATED", "Payment created");
            insertHistoryIfMissing(p3, "INITIATED", "PENDING", "Sent to bank");
            insertHistoryIfMissing(p3, "PENDING", "FAILED", "Insufficient funds at issuer");
            insertHistoryIfMissing(p3, "FAILED", "REVERSED", "Auto reversal after failure");
            insertRouteIfMissing(p3, "HSBC", "ICICI", "SBI", "DYNAMIC", "ROUTED", "Fallback route selected");
            insertReversalIfMissing(p3, new BigDecimal("89.00"), "Auto reversal after failure", "SYSTEM", "COMPLETED");

            Long p4 = createPaymentIfMissing(
                "idem_max_fatima_001", "fatima@demo.com", "MAX001", new BigDecimal("150.75"),
                "USD", "CARD", "SUCCESS", "Max premium purchase"
            );
            insertHistoryIfMissing(p4, null, "INITIATED", "Payment created");
            insertHistoryIfMissing(p4, "INITIATED", "PENDING", "3DS verification passed");
            insertHistoryIfMissing(p4, "PENDING", "SUCCESS", "Captured successfully");
            insertRouteIfMissing(p4, "HDFC", "HSBC", "HDFC", "STATIC", "ROUTED", "Merchant preferred processor");
            insertConversionIfMissing(p4, "USD", "INR", new BigDecimal("150.75"), new BigDecimal("12512.25"), new BigDecimal("83.00000000"));

            Long p5 = createPaymentIfMissing(
                "idem_ind_liam_001", "liam@demo.com", "IND001", new BigDecimal("222.40"),
                "INR", "UPI", "SUCCESS", "Indigo ticket payment"
            );
            insertHistoryIfMissing(p5, null, "INITIATED", "Payment created");
            insertHistoryIfMissing(p5, "INITIATED", "PENDING", "UPI collect initiated");
            insertHistoryIfMissing(p5, "PENDING", "SUCCESS", "UPI mandate approved");
            insertRouteIfMissing(p5, "ICICI", "SIB", "ICICI", "DYNAMIC", "ROUTED", "UPI optimized route");
            insertConversionIfMissing(p5, "INR", "INR", new BigDecimal("222.40"), new BigDecimal("222.40"), new BigDecimal("1.00000000"));

            Long p6 = createPaymentIfMissing(
                "idem_hil_alice_001", "alice@demo.com", "HIL001", new BigDecimal("480.00"),
                "AED", "CARD", "FAILED", "Hilton booking hold"
            );
            insertHistoryIfMissing(p6, null, "INITIATED", "Payment created");
            insertHistoryIfMissing(p6, "INITIATED", "PENDING", "Sent for international auth");
            insertHistoryIfMissing(p6, "PENDING", "FAILED", "Network error from acquiring bank");
            insertRouteIfMissing(p6, "SBI", "HSBC", "SBI", "STATIC", "ROUTED", "International settlement route");
            }

    private void createUserIfMissing(String name, String email, String phone, String role) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?",
                Integer.class,
                email
        );
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                name,
                email,
                phone,
                "sim-password",
                role
        );
    }

    private void createMerchantIfMissing(String userEmail, String businessName, String merchantCode, String currency) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM merchants WHERE merchant_code = ?",
                Integer.class,
                merchantCode
        );
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO merchants (user_id, business_name, merchant_code, currency) " +
                        "SELECT id, ?, ?, ? FROM users WHERE email = ?",
                businessName,
                merchantCode,
                currency,
                userEmail
        );
    }

        private void upsertMerchantRoute(String merchantCode, String preferredBankCode) {
        jdbcTemplate.update(
            """
            INSERT INTO merchant_bank_routes (merchant_id, preferred_bank_code)
            SELECT id, ? FROM merchants WHERE merchant_code = ?
            ON DUPLICATE KEY UPDATE preferred_bank_code = VALUES(preferred_bank_code)
            """,
            preferredBankCode,
            merchantCode
        );
        }

        private Long createPaymentIfMissing(String idempotencyKey,
                        String customerEmail,
                        String merchantCode,
                        BigDecimal amount,
                        String currency,
                        String paymentMethod,
                        String status,
                        String description) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM payments WHERE idempotency_key = ?",
            Integer.class,
            idempotencyKey
        );
        if (count == null || count == 0) {
            jdbcTemplate.update(
                """
                INSERT INTO payments (idempotency_key, customer_id, merchant_id, amount, currency, payment_method, status, description)
                SELECT ?, u.id, m.id, ?, ?, ?, ?, ?
                FROM users u
                JOIN merchants m ON m.merchant_code = ?
                WHERE u.email = ?
                """,
                idempotencyKey,
                amount,
                currency,
                paymentMethod,
                status,
                description,
                merchantCode,
                customerEmail
            );
        }

        return jdbcTemplate.queryForObject(
            "SELECT id FROM payments WHERE idempotency_key = ?",
            Long.class,
            idempotencyKey
        );
        }

        private void insertHistoryIfMissing(Long paymentId, String oldStatus, String newStatus, String reason) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM payment_status_history WHERE payment_id = ? AND new_status = ? AND COALESCE(reason, '') = COALESCE(?, '')",
            Integer.class,
            paymentId,
            newStatus,
            reason
        );
        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.update(
            "INSERT INTO payment_status_history (payment_id, old_status, new_status, reason) VALUES (?, ?, ?, ?)",
            paymentId,
            oldStatus,
            newStatus,
            reason
        );
        }

        private void insertRouteIfMissing(Long paymentId,
                          String merchantBankCode,
                          String customerBankCode,
                          String selectedBankCode,
                          String routingType,
                          String routeStatus,
                          String reason) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM bank_route_history WHERE payment_id = ?",
            Integer.class,
            paymentId
        );
        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.update(
            """
            INSERT INTO bank_route_history
            (payment_id, merchant_bank_code, customer_bank_code, selected_bank_code, routing_type, route_status, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            paymentId,
            merchantBankCode,
            customerBankCode,
            selectedBankCode,
            routingType,
            routeStatus,
            reason
        );
        }

        private void insertConversionIfMissing(Long paymentId,
                           String sourceCurrency,
                           String targetCurrency,
                           BigDecimal sourceAmount,
                           BigDecimal convertedAmount,
                           BigDecimal rate) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM payment_currency_conversions WHERE payment_id = ?",
            Integer.class,
            paymentId
        );
        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.update(
            """
            INSERT INTO payment_currency_conversions
            (payment_id, source_currency, target_currency, source_amount, converted_amount, rate)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            paymentId,
            sourceCurrency,
            targetCurrency,
            sourceAmount,
            convertedAmount,
            rate
        );
        }

        private void insertReversalIfMissing(Long paymentId,
                         BigDecimal amount,
                         String reason,
                         String initiatedBy,
                         String reversalStatus) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM payment_reversals WHERE payment_id = ?",
            Integer.class,
            paymentId
        );
        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.update(
            """
            INSERT INTO payment_reversals
            (payment_id, amount, reason, initiated_by, reversal_status)
            VALUES (?, ?, ?, ?, ?)
            """,
            paymentId,
            amount,
            reason,
            initiatedBy,
            reversalStatus
        );
        }
}
