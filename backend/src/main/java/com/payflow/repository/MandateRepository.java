package com.payflow.repository;

import com.payflow.model.Mandate;
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
public class MandateRepository {

    private final JdbcTemplate jdbcTemplate;

    public MandateRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Mandate> mandateRowMapper = (rs, rowNum) -> {
        Mandate mandate = new Mandate();
        mandate.setId(rs.getLong("id"));
        mandate.setLabel(rs.getString("label"));
        mandate.setMerchantCode(rs.getString("merchant_code"));
        mandate.setCustomerId(rs.getLong("customer_id"));
        mandate.setPaymentMethod(rs.getString("payment_method"));
        mandate.setInstrumentType(rs.getString("instrument_type"));
        mandate.setCardNumberMasked(rs.getString("card_number_masked"));
        mandate.setCardHolderName(rs.getString("card_holder_name"));
        mandate.setUpiId(rs.getString("upi_id"));
        mandate.setBankAccountMasked(rs.getString("bank_account_masked"));
        mandate.setBankIfsc(rs.getString("bank_ifsc"));
        mandate.setDebitAmount(rs.getBigDecimal("debit_amount"));
        mandate.setMaxAmount(rs.getBigDecimal("max_amount"));
        mandate.setCurrency(rs.getString("currency"));
        mandate.setFrequency(rs.getString("frequency"));
        mandate.setStatus(rs.getString("status"));
        Timestamp created = rs.getTimestamp("created_at");
        if (created != null) {
            mandate.setCreatedAt(created.toLocalDateTime());
        }
        Timestamp updated = rs.getTimestamp("updated_at");
        if (updated != null) {
            mandate.setUpdatedAt(updated.toLocalDateTime());
        }
        return mandate;
    };

    public Mandate save(Mandate mandate) {
        String sql = """
                INSERT INTO autopay_mandates
                (label, merchant_code, customer_id, payment_method, instrument_type, card_number_masked, card_holder_name,
                 upi_id, bank_account_masked, bank_ifsc, debit_amount, max_amount, currency, frequency, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, mandate.getLabel());
            ps.setString(2, mandate.getMerchantCode());
            ps.setLong(3, mandate.getCustomerId());
            ps.setString(4, mandate.getPaymentMethod());
            ps.setString(5, mandate.getInstrumentType());
            ps.setString(6, mandate.getCardNumberMasked());
            ps.setString(7, mandate.getCardHolderName());
            ps.setString(8, mandate.getUpiId());
            ps.setString(9, mandate.getBankAccountMasked());
            ps.setString(10, mandate.getBankIfsc());
            ps.setBigDecimal(11, mandate.getDebitAmount());
            ps.setBigDecimal(12, mandate.getMaxAmount());
            ps.setString(13, mandate.getCurrency());
            ps.setString(14, mandate.getFrequency());
            ps.setString(15, mandate.getStatus());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            mandate.setId(generatedId.longValue());
        }
        return mandate;
    }

    public Optional<Mandate> findById(Long id) {
        List<Mandate> result = jdbcTemplate.query(
                "SELECT * FROM autopay_mandates WHERE id = ?",
                mandateRowMapper,
                id
        );
        return result.stream().findFirst();
    }

    public List<Mandate> findByMerchantCode(String merchantCode) {
        return jdbcTemplate.query(
                "SELECT * FROM autopay_mandates WHERE merchant_code = ? ORDER BY created_at DESC",
                mandateRowMapper,
                merchantCode
        );
    }

    public int updateStatus(Long id, String status) {
        return jdbcTemplate.update(
                "UPDATE autopay_mandates SET status = ?, updated_at = NOW() WHERE id = ?",
                status,
                id
        );
    }

    public int deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM autopay_mandates WHERE id = ?", id);
    }
}
