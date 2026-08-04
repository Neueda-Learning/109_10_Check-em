-- ============================================================
-- PayFlow — Basic Starter Schema
-- Just 4 tables. Every other feature branches from here.
-- Built for Spring Boot + MySQL
-- ============================================================

DROP DATABASE IF EXISTS payflow;
CREATE DATABASE payflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE payflow;

-- ============================================================
-- TABLE 1: USERS
-- Stores everyone — customers and merchants.
-- role column tells them apart.
-- This is the only identity table you need to start.
-- ============================================================

CREATE TABLE users (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)    NOT NULL,
    email         VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20)         NULL,
    password_hash VARCHAR(255)    NOT NULL,
    role          ENUM(
                    'CUSTOMER',
                    'MERCHANT',
                    'ADMIN'
                  )               NOT NULL DEFAULT 'CUSTOMER',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 2: MERCHANTS
-- A merchant is just a business profile linked to a user.
-- merchant_code is what identifies H&M in a payment request.
-- ============================================================

CREATE TABLE merchants (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    business_name   VARCHAR(255)    NOT NULL,
    merchant_code   VARCHAR(50)     NOT NULL,
    currency        VARCHAR(10)     NOT NULL DEFAULT 'GBP',

    PRIMARY KEY (id),
    UNIQUE KEY uq_merchant_code (merchant_code),
    CONSTRAINT fk_merchant_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 3: PAYMENTS
-- The core table. One row per payment attempt.
-- idempotency_key is UNIQUE — this single column
-- prevents a customer being charged twice if their
-- app retries the same request.
-- amount + currency tells you what was paid.
-- status tells you where it is in the lifecycle.
-- ============================================================

CREATE TABLE payments (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    idempotency_key     VARCHAR(255)    NOT NULL,
    customer_id         BIGINT          NOT NULL,
    merchant_id         BIGINT          NOT NULL,
    amount              DECIMAL(12,2)   NOT NULL,
    currency            VARCHAR(10)     NOT NULL DEFAULT 'GBP',
    payment_method      ENUM(
                          'CARD',
                          'BANK_TRANSFER',
                          'UPI',
                          'WALLET'
                        )               NOT NULL,
    status              ENUM(
                          'INITIATED',
                          'PENDING',
                          'SUCCESS',
                          'FAILED',
                          'REVERSED'
                        )               NOT NULL DEFAULT 'INITIATED',
    description         VARCHAR(255)        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_idempotency (idempotency_key),
    CONSTRAINT fk_payment_customer
        FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_payment_merchant
        FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 4: PAYMENT_STATUS_HISTORY
-- Every time a payment status changes, insert one row here.
-- Never update — only insert. Gives you a full audit trail.
-- This is what powers the "Track Payment" feature.
-- e.g: INITIATED → PENDING → SUCCESS
-- ============================================================

CREATE TABLE payment_status_history (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    payment_id      BIGINT          NOT NULL,
    old_status      VARCHAR(50)         NULL,
    new_status      VARCHAR(50)     NOT NULL,
    reason          VARCHAR(255)        NULL,
    changed_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_history_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;


-- ============================================================
-- SEED DATA — Ready for demo and testing
-- ============================================================

-- Demo merchant user (H&M)
INSERT INTO users (name, email, phone, password_hash, role) VALUES
('H&M Store',     'store@hm.com',        '+441234567890',
 '$2b$12$replacewithrealbcrypt', 'MERCHANT');

-- Demo customers
INSERT INTO users (name, email, phone, password_hash, role) VALUES
('Alice Johnson',  'alice@demo.com',  '+447000000001', '$2b$12$replacewithrealbcrypt', 'CUSTOMER'),
('Bob Smith',      'bob@demo.com',    '+447000000002', '$2b$12$replacewithrealbcrypt', 'CUSTOMER');

-- H&M merchant profile (links to user id 1)
INSERT INTO merchants (user_id, business_name, merchant_code, currency) VALUES
(1, 'H&M Retail', 'HM001', 'GBP');

-- Demo payments
INSERT INTO payments
  (idempotency_key, customer_id, merchant_id, amount, currency, payment_method, status, description)
VALUES
('key-alice-001', 2, 1, 49.99, 'GBP', 'CARD',          'SUCCESS', 'H&M jacket purchase'),
('key-alice-002', 2, 1, 12.50, 'GBP', 'WALLET',        'PENDING', 'H&M accessories'),
('key-bob-001',   3, 1, 89.00, 'GBP', 'BANK_TRANSFER',  'FAILED',  'H&M coat purchase');

-- Status history for those payments
INSERT INTO payment_status_history (payment_id, old_status, new_status, reason) VALUES
(1, NULL,        'INITIATED', 'Payment created'),
(1, 'INITIATED', 'PENDING',   'Sent to bank'),
(1, 'PENDING',   'SUCCESS',   'Bank confirmed'),
(2, NULL,        'INITIATED', 'Payment created'),
(2, 'INITIATED', 'PENDING',   'Awaiting confirmation'),
(3, NULL,        'INITIATED', 'Payment created'),
(3, 'INITIATED', 'PENDING',   'Sent to bank'),
(3, 'PENDING',   'FAILED',    'Insufficient funds');


-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'users'                  AS tbl, COUNT(*) AS rows FROM users
UNION ALL
SELECT 'merchants',               COUNT(*) FROM merchants
UNION ALL
SELECT 'payments',                COUNT(*) FROM payments
UNION ALL
SELECT 'payment_status_history',  COUNT(*) FROM payment_status_history;

SELECT 'users'                 AS tbl, COUNT(*) AS `rows` FROM users
UNION ALL
SELECT 'merchants',              COUNT(*) FROM merchants
UNION ALL
SELECT 'payments',               COUNT(*) FROM payments
UNION ALL
SELECT 'payment_status_history', COUNT(*) FROM payment_status_history;

-- ============================================================
-- EXTENSIONS FOR ADVANCED PAYMENT GATEWAY FEATURES
-- 1) Bank routing and traffic simulation
-- 2) Multi-currency conversion records and cache
-- 3) Payment reversals
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_nodes (
  id              BIGINT          NOT NULL AUTO_INCREMENT,
  bank_code       VARCHAR(20)     NOT NULL,
  bank_name       VARCHAR(120)    NOT NULL,
  is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
  current_load    INT             NOT NULL DEFAULT 0,
  max_capacity    INT             NOT NULL,
  priority_weight INT             NOT NULL DEFAULT 50,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bank_nodes_code (bank_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS merchant_bank_routes (
  id                  BIGINT          NOT NULL AUTO_INCREMENT,
  merchant_id         BIGINT          NOT NULL,
  preferred_bank_code VARCHAR(20)     NOT NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_merchant_route (merchant_id),
  CONSTRAINT fk_merchant_bank_route_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  CONSTRAINT fk_merchant_bank_route_bank
    FOREIGN KEY (preferred_bank_code) REFERENCES bank_nodes(bank_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bank_route_history (
  id                  BIGINT          NOT NULL AUTO_INCREMENT,
  payment_id          BIGINT          NOT NULL,
  merchant_bank_code  VARCHAR(20)         NULL,
  customer_bank_code  VARCHAR(20)         NULL,
  selected_bank_code  VARCHAR(20)     NOT NULL,
  routing_type        VARCHAR(30)     NOT NULL,
  route_status        VARCHAR(30)     NOT NULL,
  reason              VARCHAR(255)        NULL,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bank_route_payment (payment_id),
  CONSTRAINT fk_route_history_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_route_history_selected_bank
    FOREIGN KEY (selected_bank_code) REFERENCES bank_nodes(bank_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS currency_rate_cache (
  id               BIGINT          NOT NULL AUTO_INCREMENT,
  source_currency  VARCHAR(10)     NOT NULL,
  target_currency  VARCHAR(10)     NOT NULL,
  rate             DECIMAL(18,8)   NOT NULL,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_currency_pair (source_currency, target_currency)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_currency_conversions (
  id                BIGINT          NOT NULL AUTO_INCREMENT,
  payment_id        BIGINT          NOT NULL,
  source_currency   VARCHAR(10)     NOT NULL,
  target_currency   VARCHAR(10)     NOT NULL,
  source_amount     DECIMAL(12,2)   NOT NULL,
  converted_amount  DECIMAL(12,2)   NOT NULL,
  rate              DECIMAL(18,8)   NOT NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_conv_payment (payment_id),
  CONSTRAINT fk_payment_conversion_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_reversals (
  id               BIGINT           NOT NULL AUTO_INCREMENT,
  payment_id       BIGINT           NOT NULL,
  amount           DECIMAL(12,2)    NOT NULL,
  reason           VARCHAR(255)         NULL,
  initiated_by     VARCHAR(120)         NULL,
  reversal_status  VARCHAR(30)      NOT NULL,
  created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reversal_payment (payment_id),
  CONSTRAINT fk_reversal_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

-- Seed Indian banks for routing simulation
INSERT INTO bank_nodes (bank_code, bank_name, is_active, current_load, max_capacity, priority_weight)
VALUES
('HSBC',  'HSBC Bank India',       TRUE, 0, 120, 90),
('HDFC',  'HDFC Bank',             TRUE, 0, 150, 95),
('ICICI', 'ICICI Bank',            TRUE, 0, 140, 92),
('SBI',   'State Bank of India',   TRUE, 0, 300, 100),
('SIB',   'South Indian Bank',     TRUE, 0, 100, 80)
ON DUPLICATE KEY UPDATE
bank_name = VALUES(bank_name),
is_active = VALUES(is_active),
max_capacity = VALUES(max_capacity),
priority_weight = VALUES(priority_weight);

-- Example merchant preferred bank mapping
INSERT INTO merchant_bank_routes (merchant_id, preferred_bank_code)
VALUES (1, 'HSBC')
ON DUPLICATE KEY UPDATE preferred_bank_code = VALUES(preferred_bank_code);

-- FX cache starter rates (fallback seed)
INSERT INTO currency_rate_cache (source_currency, target_currency, rate, updated_at)
VALUES
('INR', 'USD', 0.01200000, NOW()),
('USD', 'INR', 83.00000000, NOW()),
('INR', 'AED', 0.04400000, NOW()),
('AED', 'INR', 22.70000000, NOW()),
('USD', 'AED', 3.67000000, NOW()),
('AED', 'USD', 0.27000000, NOW())
ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = VALUES(updated_at);

-- ============================================================
-- OPTIONAL MYSQL COMMANDS TO RUN MANUALLY
-- ============================================================
-- USE payflow;
-- SOURCE schema.sql;
-- SHOW TABLES;
-- DESCRIBE bank_nodes;
-- DESCRIBE merchant_bank_routes;
-- DESCRIBE bank_route_history;
-- DESCRIBE currency_rate_cache;
-- DESCRIBE payment_currency_conversions;
-- DESCRIBE payment_reversals;