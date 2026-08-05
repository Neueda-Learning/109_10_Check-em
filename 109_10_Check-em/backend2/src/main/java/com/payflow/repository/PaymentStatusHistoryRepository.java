package com.payflow.repository;

import com.payflow.model.Payment;
import com.payflow.model.PaymentStatusHistory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class PaymentStatusHistoryRepository {

    private final JdbcTemplate jdbc;

    public PaymentStatusHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<PaymentStatusHistory> historyMapper = (rs, rowNum) -> {
        PaymentStatusHistory h = new PaymentStatusHistory();
        h.setId(rs.getLong("id"));
        h.setOldStatus(rs.getString("old_status"));
        h.setNewStatus(rs.getString("new_status"));
        h.setReason(rs.getString("reason"));
        Timestamp ts = rs.getTimestamp("changed_at");
        if (ts != null) h.setChangedAt(ts.toLocalDateTime());
        Payment p = new Payment();
        p.setId(rs.getLong("payment_id"));
        h.setPayment(p);
        return h;
    };

    public void save(PaymentStatusHistory history) {
        String sql = "INSERT INTO payment_status_history " +
                     "(payment_id, old_status, new_status, reason) " +
                     "VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, history.getPayment().getId());
            ps.setString(2, history.getOldStatus());
            ps.setString(3, history.getNewStatus());
            ps.setString(4, history.getReason());
            return ps;
        }, keyHolder);
        history.setId(keyHolder.getKey().longValue());
    }

    public List<PaymentStatusHistory> findByPaymentIdOrderByChangedAtAsc(Long paymentId) {
        String sql = "SELECT * FROM payment_status_history " +
                     "WHERE payment_id = ? ORDER BY changed_at ASC";
        return jdbc.query(sql, historyMapper, paymentId);
    }
}