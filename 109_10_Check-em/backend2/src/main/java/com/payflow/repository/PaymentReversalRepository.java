package com.payflow.repository;

import com.payflow.model.PaymentReversal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class PaymentReversalRepository {

    private final JdbcTemplate jdbc;

    public PaymentReversalRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PaymentReversal save(PaymentReversal reversal) {
        String sql = "INSERT INTO payment_reversals (payment_id, amount, reason, initiated_by, reversal_status) " +
                "VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, reversal.getPaymentId());
            ps.setBigDecimal(2, reversal.getAmount());
            ps.setString(3, reversal.getReason());
            ps.setString(4, reversal.getInitiatedBy());
            ps.setString(5, reversal.getReversalStatus());
            return ps;
        }, keyHolder);
        reversal.setId(keyHolder.getKey().longValue());
        return reversal;
    }

    public List<PaymentReversal> findByPaymentId(Long paymentId) {
        String sql = "SELECT * FROM payment_reversals WHERE payment_id = ? ORDER BY created_at DESC";
        return jdbc.query(sql, (rs, rowNum) -> {
            PaymentReversal reversal = new PaymentReversal();
            reversal.setId(rs.getLong("id"));
            reversal.setPaymentId(rs.getLong("payment_id"));
            reversal.setAmount(rs.getBigDecimal("amount"));
            reversal.setReason(rs.getString("reason"));
            reversal.setInitiatedBy(rs.getString("initiated_by"));
            reversal.setReversalStatus(rs.getString("reversal_status"));
            Timestamp created = rs.getTimestamp("created_at");
            if (created != null) {
                reversal.setCreatedAt(created.toLocalDateTime());
            }
            return reversal;
        }, paymentId);
    }
}
