package com.payflow.repository;

import com.payflow.model.CurrencyConversionRecord;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class CurrencyConversionRepository {

    private final JdbcTemplate jdbc;

    public CurrencyConversionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<BigDecimal> findCachedRate(String fromCurrency, String toCurrency) {
        String sql = "SELECT rate FROM currency_rate_cache " +
                "WHERE source_currency = ? AND target_currency = ? AND updated_at >= ? " +
                "ORDER BY updated_at DESC LIMIT 1";
        Timestamp cutoff = Timestamp.valueOf(LocalDateTime.now().minusHours(2));
        List<BigDecimal> rates = jdbc.query(sql,
                (rs, rowNum) -> rs.getBigDecimal("rate"), fromCurrency, toCurrency, cutoff);
        return rates.stream().findFirst();
    }

    public void upsertCachedRate(String fromCurrency, String toCurrency, BigDecimal rate) {
        String sql = "INSERT INTO currency_rate_cache (source_currency, target_currency, rate, updated_at) " +
                "VALUES (?, ?, ?, NOW()) " +
                "ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = VALUES(updated_at)";
        jdbc.update(sql, fromCurrency, toCurrency, rate);
    }

    public CurrencyConversionRecord save(CurrencyConversionRecord record) {
        String sql = "INSERT INTO payment_currency_conversions " +
                "(payment_id, source_currency, target_currency, source_amount, converted_amount, rate) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, record.getPaymentId());
            ps.setString(2, record.getSourceCurrency());
            ps.setString(3, record.getTargetCurrency());
            ps.setBigDecimal(4, record.getSourceAmount());
            ps.setBigDecimal(5, record.getConvertedAmount());
            ps.setBigDecimal(6, record.getRate());
            return ps;
        }, keyHolder);
        record.setId(keyHolder.getKey().longValue());
        return record;
    }

    public Optional<CurrencyConversionRecord> findLatestByPaymentId(Long paymentId) {
        String sql = "SELECT * FROM payment_currency_conversions WHERE payment_id = ? ORDER BY created_at DESC LIMIT 1";
        List<CurrencyConversionRecord> records = jdbc.query(sql, (rs, rowNum) -> {
            CurrencyConversionRecord record = new CurrencyConversionRecord();
            record.setId(rs.getLong("id"));
            record.setPaymentId(rs.getLong("payment_id"));
            record.setSourceCurrency(rs.getString("source_currency"));
            record.setTargetCurrency(rs.getString("target_currency"));
            record.setSourceAmount(rs.getBigDecimal("source_amount"));
            record.setConvertedAmount(rs.getBigDecimal("converted_amount"));
            record.setRate(rs.getBigDecimal("rate"));
            Timestamp created = rs.getTimestamp("created_at");
            if (created != null) {
                record.setCreatedAt(created.toLocalDateTime());
            }
            return record;
        }, paymentId);
        return records.stream().findFirst();
    }
}
