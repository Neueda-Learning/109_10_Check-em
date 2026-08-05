package com.payflow.repository;

import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.Role;
import com.payflow.model.Merchant;
import com.payflow.model.Payment;
import com.payflow.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class PaymentRepository {

    private final JdbcTemplate jdbc;

    public PaymentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Payment> paymentMapper = (rs, rowNum) -> {
        Payment p = new Payment();
        p.setId(rs.getLong("id"));
        p.setIdempotencyKey(rs.getString("idempotency_key"));
        p.setAmount(rs.getBigDecimal("amount"));
        p.setCurrency(rs.getString("currency"));
        p.setPaymentMethod(PaymentMethod.valueOf(rs.getString("payment_method")));
        p.setStatus(PaymentStatus.valueOf(rs.getString("status")));
        p.setDescription(rs.getString("description"));
        Timestamp created = rs.getTimestamp("created_at");
        if (created != null) p.setCreatedAt(created.toLocalDateTime());
        Timestamp updated = rs.getTimestamp("updated_at");
        if (updated != null) p.setUpdatedAt(updated.toLocalDateTime());
        User customer = new User();
        customer.setId(rs.getLong("customer_id"));
        customer.setName(rs.getString("c_name"));
        customer.setEmail(rs.getString("c_email"));
        customer.setRole(Role.CUSTOMER);
        p.setCustomer(customer);
        Merchant merchant = new Merchant();
        merchant.setId(rs.getLong("merchant_id"));
        merchant.setBusinessName(rs.getString("m_business_name"));
        merchant.setMerchantCode(rs.getString("m_merchant_code"));
        merchant.setCurrency(rs.getString("m_currency"));
        p.setMerchant(merchant);
        return p;
    };

    private static final String BASE_SELECT =
        "SELECT p.*, " +
        "c.name AS c_name, c.email AS c_email, " +
        "m.business_name AS m_business_name, m.merchant_code AS m_merchant_code, m.currency AS m_currency " +
        "FROM payments p " +
        "JOIN users c ON p.customer_id = c.id " +
        "JOIN merchants m ON p.merchant_id = m.id ";

    public Payment save(Payment payment) {
        String sql = "INSERT INTO payments " +
                "(idempotency_key, customer_id, merchant_id, amount, currency, " +
                "payment_method, status, description) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, payment.getIdempotencyKey());
            ps.setLong(2, payment.getCustomer().getId());
            ps.setLong(3, payment.getMerchant().getId());
            ps.setBigDecimal(4, payment.getAmount());
            ps.setString(5, payment.getCurrency());
            ps.setString(6, payment.getPaymentMethod().name());
            ps.setString(7, payment.getStatus().name());
            ps.setString(8, payment.getDescription());
            return ps;
        }, keyHolder);
        payment.setId(keyHolder.getKey().longValue());
        return payment;
    }

    public void updateStatus(Long id, PaymentStatus status) {
        String sql = "UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?";
        jdbc.update(sql, status.name(), id);
    }

    // UPDATE description only
    // amount/customer/merchant must never change on an existing payment
    public int updateDescription(Long id, String description) {
        String sql = "UPDATE payments SET description = ?, updated_at = NOW() WHERE id = ?";
        return jdbc.update(sql, description, id);
    }

    // DELETE payment and its history
    public int deleteById(Long id) {
        // Delete history first because of foreign key
        jdbc.update("DELETE FROM payment_status_history WHERE payment_id = ?", id);
        return jdbc.update("DELETE FROM payments WHERE id = ?", id);
    }

    public Optional<Payment> findById(Long id) {
        String sql = BASE_SELECT + "WHERE p.id = ?";
        List<Payment> result = jdbc.query(sql, paymentMapper, id);
        return result.stream().findFirst();
    }

    public Optional<Payment> findByIdempotencyKey(String key) {
        String sql = BASE_SELECT + "WHERE p.idempotency_key = ?";
        List<Payment> result = jdbc.query(sql, paymentMapper, key);
        return result.stream().findFirst();
    }

    public List<Payment> findByCustomerId(Long customerId) {
        String sql = BASE_SELECT + "WHERE p.customer_id = ?";
        return jdbc.query(sql, paymentMapper, customerId);
    }

    public List<Payment> findByMerchantId(Long merchantId) {
        String sql = BASE_SELECT + "WHERE p.merchant_id = ?";
        return jdbc.query(sql, paymentMapper, merchantId);
    }

    public List<Payment> searchPayments(Long customerId,
                                        Long merchantId,
                                        String status,
                                        String method,
                                        String currency,
                                        LocalDateTime fromDate,
                                        LocalDateTime toDate,
                                        Integer limit,
                                        Integer offset) {
        StringBuilder sql = new StringBuilder(BASE_SELECT + "WHERE 1=1 ");
        ArrayList<Object> params = new ArrayList<>();

        if (customerId != null) {
            sql.append("AND p.customer_id = ? ");
            params.add(customerId);
        }
        if (merchantId != null) {
            sql.append("AND p.merchant_id = ? ");
            params.add(merchantId);
        }
        if (status != null && !status.isBlank()) {
            sql.append("AND p.status = ? ");
            params.add(status);
        }
        if (method != null && !method.isBlank()) {
            sql.append("AND p.payment_method = ? ");
            params.add(method);
        }
        if (currency != null && !currency.isBlank()) {
            sql.append("AND p.currency = ? ");
            params.add(currency);
        }
        if (fromDate != null) {
            sql.append("AND p.created_at >= ? ");
            params.add(Timestamp.valueOf(fromDate));
        }
        if (toDate != null) {
            sql.append("AND p.created_at <= ? ");
            params.add(Timestamp.valueOf(toDate));
        }

        sql.append("ORDER BY p.created_at DESC ");
        sql.append("LIMIT ? OFFSET ?");
        params.add(limit != null && limit > 0 ? Math.min(limit, 200) : 50);
        params.add(offset != null && offset >= 0 ? offset : 0);

        return jdbc.query(sql.toString(), paymentMapper, params.toArray());
    }
}