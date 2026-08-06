package com.payflow.repository;

import com.payflow.dto.AutopayCustomerResponse;
import com.payflow.enums.Role;
import com.payflow.model.Merchant;
import com.payflow.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class MerchantRepository {

    private final JdbcTemplate jdbc;

    public MerchantRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Merchant> merchantMapper = (rs, rowNum) -> {
        Merchant m = new Merchant();
        m.setId(rs.getLong("id"));
        m.setBusinessName(rs.getString("business_name"));
        m.setMerchantCode(rs.getString("merchant_code"));
        m.setCurrency(rs.getString("currency"));
        m.setAutopayEnabled(rs.getBoolean("autopay_enabled"));
        User user = new User();
        user.setId(rs.getLong("user_id"));
        user.setName(rs.getString("u_name"));
        user.setEmail(rs.getString("u_email"));
        user.setRole(Role.valueOf(rs.getString("u_role")));
        m.setUser(user);
        return m;
    };

    private static final String BASE_SELECT =
        "SELECT m.id, m.user_id, m.business_name, m.merchant_code, m.currency, m.autopay_enabled, " +
        "u.name AS u_name, u.email AS u_email, u.role AS u_role " +
        "FROM merchants m JOIN users u ON m.user_id = u.id ";

    private final RowMapper<AutopayCustomerResponse> autopayCustomerMapper = (rs, rowNum) -> {
        AutopayCustomerResponse row = new AutopayCustomerResponse();
        row.setCustomerId(rs.getLong("customer_id"));
        row.setCustomerName(rs.getString("customer_name"));
        row.setCustomerEmail(rs.getString("customer_email"));
        row.setCustomerPhone(rs.getString("customer_phone"));
        row.setMandateCount(rs.getLong("mandate_count"));
        row.setActiveMandates(rs.getLong("active_mandates"));
        row.setPausedMandates(rs.getLong("paused_mandates"));
        row.setTotalDebitAmount(rs.getBigDecimal("total_debit_amount"));
        row.setTotalMaxAmount(rs.getBigDecimal("total_max_amount"));
        row.setLatestOrderId(rs.getString("latest_order_id"));
        Timestamp updatedAt = rs.getTimestamp("last_updated_at");
        if (updatedAt != null) {
            row.setLastUpdatedAt(updatedAt.toLocalDateTime());
        }
        return row;
    };

    public Merchant save(Merchant merchant) {
        String sql = "INSERT INTO merchants (user_id, business_name, merchant_code, currency, autopay_enabled) " +
                 "VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, merchant.getUser().getId());
            ps.setString(2, merchant.getBusinessName());
            ps.setString(3, merchant.getMerchantCode());
            ps.setString(4, merchant.getCurrency());
            ps.setBoolean(5, merchant.isAutopayEnabled());
            return ps;
        }, keyHolder);
        merchant.setId(keyHolder.getKey().longValue());
        return merchant;
    }

    // UPDATE business name and currency
    // merchant_code is not updatable — it's like a username
    public int update(Long id, String businessName, String currency, boolean autopayEnabled) {
        String sql = "UPDATE merchants SET business_name = ?, currency = ?, autopay_enabled = ? WHERE id = ?";
        return jdbc.update(sql, businessName, currency, autopayEnabled, id);
    }

    // DELETE merchant by ID
    public int deleteById(Long id) {
        String sql = "DELETE FROM merchants WHERE id = ?";
        return jdbc.update(sql, id);
    }

    public int deleteCascadeById(Long merchantId, String merchantCode) {
        jdbc.update("DELETE FROM bank_route_history WHERE payment_id IN (SELECT id FROM payments WHERE merchant_id = ?)", merchantId);
        jdbc.update("DELETE FROM payment_currency_conversions WHERE payment_id IN (SELECT id FROM payments WHERE merchant_id = ?)", merchantId);
        jdbc.update("DELETE FROM payment_reversals WHERE payment_id IN (SELECT id FROM payments WHERE merchant_id = ?)", merchantId);
        jdbc.update("DELETE FROM payment_status_history WHERE payment_id IN (SELECT id FROM payments WHERE merchant_id = ?)", merchantId);
        jdbc.update("DELETE FROM payments WHERE merchant_id = ?", merchantId);
        jdbc.update("DELETE FROM merchant_bank_routes WHERE merchant_id = ?", merchantId);
        jdbc.update("DELETE FROM autopay_mandates WHERE merchant_code = ?", merchantCode);
        return jdbc.update("DELETE FROM merchants WHERE id = ?", merchantId);
    }

    public List<AutopayCustomerResponse> findAutopayCustomersByMerchantCode(String merchantCode) {
        String sql = """
                SELECT
                    u.id AS customer_id,
                    COALESCE(MAX(am.customer_name), u.name) AS customer_name,
                    COALESCE(MAX(am.customer_email), u.email) AS customer_email,
                    COALESCE(MAX(am.customer_phone), u.phone) AS customer_phone,
                    COUNT(*) AS mandate_count,
                    SUM(CASE WHEN am.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_mandates,
                    SUM(CASE WHEN am.status = 'PAUSED' THEN 1 ELSE 0 END) AS paused_mandates,
                    COALESCE(SUM(am.debit_amount), 0) AS total_debit_amount,
                    COALESCE(SUM(am.max_amount), 0) AS total_max_amount,
                    MAX(am.order_id) AS latest_order_id,
                    MAX(am.updated_at) AS last_updated_at
                FROM autopay_mandates am
                JOIN users u ON u.id = am.customer_id
                WHERE am.merchant_code = ?
                GROUP BY u.id, u.name, u.email, u.phone
                ORDER BY active_mandates DESC, mandate_count DESC, u.name ASC
                """;
        return jdbc.query(sql, autopayCustomerMapper, merchantCode);
    }

    public Optional<Merchant> findById(Long id) {
        String sql = BASE_SELECT + "WHERE m.id = ?";
        List<Merchant> result = jdbc.query(sql, merchantMapper, id);
        return result.stream().findFirst();
    }

    public Optional<Merchant> findByMerchantCode(String merchantCode) {
        String sql = BASE_SELECT + "WHERE m.merchant_code = ?";
        List<Merchant> result = jdbc.query(sql, merchantMapper, merchantCode);
        return result.stream().findFirst();
    }

    public List<Merchant> findAll() {
        return jdbc.query(BASE_SELECT, merchantMapper);
    }
}