package com.payflow.repository;

import com.payflow.enums.Role;
import com.payflow.model.Merchant;
import com.payflow.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
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