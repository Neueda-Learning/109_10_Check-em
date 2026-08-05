package com.payflow.repository;

import com.payflow.model.BankNode;
import com.payflow.model.BankRouteHistory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class BankRoutingRepository {

    private final JdbcTemplate jdbc;

    public BankRoutingRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<BankNode> bankNodeMapper = (rs, rowNum) -> {
        BankNode node = new BankNode();
        node.setId(rs.getLong("id"));
        node.setBankCode(rs.getString("bank_code"));
        node.setBankName(rs.getString("bank_name"));
        node.setActive(rs.getBoolean("is_active"));
        node.setCurrentLoad(rs.getInt("current_load"));
        node.setMaxCapacity(rs.getInt("max_capacity"));
        node.setPriorityWeight(rs.getInt("priority_weight"));
        return node;
    };

    private final RowMapper<BankRouteHistory> routeHistoryMapper = (rs, rowNum) -> {
        BankRouteHistory route = new BankRouteHistory();
        route.setId(rs.getLong("id"));
        route.setPaymentId(rs.getLong("payment_id"));
        route.setMerchantBankCode(rs.getString("merchant_bank_code"));
        route.setCustomerBankCode(rs.getString("customer_bank_code"));
        route.setSelectedBankCode(rs.getString("selected_bank_code"));
        route.setRoutingType(rs.getString("routing_type"));
        route.setRouteStatus(rs.getString("route_status"));
        route.setReason(rs.getString("reason"));
        Timestamp created = rs.getTimestamp("created_at");
        if (created != null) {
            route.setCreatedAt(created.toLocalDateTime());
        }
        return route;
    };

    public void upsertBankNode(String bankCode, String bankName, int maxCapacity, int priorityWeight) {
        String sql = "INSERT INTO bank_nodes (bank_code, bank_name, is_active, current_load, max_capacity, priority_weight) " +
                "VALUES (?, ?, TRUE, 0, ?, ?) " +
                "ON DUPLICATE KEY UPDATE bank_name = VALUES(bank_name), max_capacity = VALUES(max_capacity), priority_weight = VALUES(priority_weight), is_active = TRUE";
        jdbc.update(sql, bankCode, bankName, maxCapacity, priorityWeight);
    }

    public void upsertMerchantRoute(Long merchantId, String preferredBankCode) {
        String sql = "INSERT INTO merchant_bank_routes (merchant_id, preferred_bank_code) VALUES (?, ?) " +
                "ON DUPLICATE KEY UPDATE preferred_bank_code = VALUES(preferred_bank_code)";
        jdbc.update(sql, merchantId, preferredBankCode);
    }

    public Optional<String> findPreferredBankCode(Long merchantId) {
        String sql = "SELECT preferred_bank_code FROM merchant_bank_routes WHERE merchant_id = ?";
        List<String> rows = jdbc.query(sql, (rs, rowNum) -> rs.getString("preferred_bank_code"), merchantId);
        return rows.stream().findFirst();
    }

    public Optional<BankNode> findActiveBankByCode(String bankCode) {
        String sql = "SELECT * FROM bank_nodes WHERE bank_code = ? AND is_active = TRUE";
        List<BankNode> result = jdbc.query(sql, bankNodeMapper, bankCode);
        return result.stream().findFirst();
    }

    public Optional<BankNode> findLeastLoadedBankExcluding(String excludedBankCode) {
        String sql = "SELECT * FROM bank_nodes " +
                "WHERE is_active = TRUE AND bank_code <> ? AND current_load < max_capacity " +
                "ORDER BY (current_load / NULLIF(max_capacity, 0)) ASC, priority_weight DESC LIMIT 1";
        List<BankNode> result = jdbc.query(sql, bankNodeMapper, excludedBankCode);
        return result.stream().findFirst();
    }

    public List<BankNode> findAllActiveBanks() {
        String sql = "SELECT * FROM bank_nodes WHERE is_active = TRUE ORDER BY priority_weight DESC, bank_name ASC";
        return jdbc.query(sql, bankNodeMapper);
    }

    public void incrementBankLoad(String bankCode) {
        String sql = "UPDATE bank_nodes SET current_load = current_load + 1 WHERE bank_code = ?";
        jdbc.update(sql, bankCode);
    }

    public void decrementBankLoad(String bankCode) {
        String sql = "UPDATE bank_nodes SET current_load = CASE WHEN current_load > 0 THEN current_load - 1 ELSE 0 END WHERE bank_code = ?";
        jdbc.update(sql, bankCode);
    }

    public BankRouteHistory saveRouteHistory(BankRouteHistory routeHistory) {
        String sql = "INSERT INTO bank_route_history " +
                "(payment_id, merchant_bank_code, customer_bank_code, selected_bank_code, routing_type, route_status, reason) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, routeHistory.getPaymentId());
            ps.setString(2, routeHistory.getMerchantBankCode());
            ps.setString(3, routeHistory.getCustomerBankCode());
            ps.setString(4, routeHistory.getSelectedBankCode());
            ps.setString(5, routeHistory.getRoutingType());
            ps.setString(6, routeHistory.getRouteStatus());
            ps.setString(7, routeHistory.getReason());
            return ps;
        }, keyHolder);
        routeHistory.setId(keyHolder.getKey().longValue());
        return routeHistory;
    }

    public Optional<BankRouteHistory> findLatestByPaymentId(Long paymentId) {
        String sql = "SELECT * FROM bank_route_history WHERE payment_id = ? ORDER BY created_at DESC LIMIT 1";
        List<BankRouteHistory> routes = jdbc.query(sql, routeHistoryMapper, paymentId);
        return routes.stream().findFirst();
    }
}
