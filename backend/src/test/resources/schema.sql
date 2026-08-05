DROP TABLE IF EXISTS payment_reversals;
DROP TABLE IF EXISTS payment_currency_conversions;
DROP TABLE IF EXISTS currency_rate_cache;
DROP TABLE IF EXISTS bank_route_history;
DROP TABLE IF EXISTS merchant_bank_routes;
DROP TABLE IF EXISTS bank_nodes;
DROP TABLE IF EXISTS payment_status_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS merchants;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE(email)
);

CREATE TABLE merchants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    merchant_code VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    PRIMARY KEY (id),
    UNIQUE(merchant_code),
    CONSTRAINT fk_merchant_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    idempotency_key VARCHAR(255) NOT NULL,
    customer_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE(idempotency_key),
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_payment_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE TABLE payment_status_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_id BIGINT NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    reason VARCHAR(255) NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_history_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
(1, 'H&M Store', 'store@hm.com', '+919100000001', 'test', 'MERCHANT'),
(2, 'Alice Johnson', 'alice@demo.com', '+447700900001', 'test', 'CUSTOMER'),
(3, 'Bob Smith', 'bob@demo.com', '+14155550102', 'test', 'CUSTOMER'),
(4, 'Chris Patel', 'chris@demo.com', '+919876543210', 'test', 'CUSTOMER'),
(5, 'Indigo Store', 'store@indigo.com', '+919100000003', 'test', 'MERCHANT'),
(6, 'Hilton Store', 'store@hilton.com', '+919100000004', 'test', 'MERCHANT');

INSERT INTO merchants (id, user_id, business_name, merchant_code, currency) VALUES
(1, 1, 'H&M Retail', 'HM001', 'USD'),
(2, 5, 'Indigo Airlines', 'IND001', 'INR'),
(3, 6, 'Hilton Hotels', 'HIL001', 'USD');
