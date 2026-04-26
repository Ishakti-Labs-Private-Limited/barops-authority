package com.ishakti.barops.api.repository;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AttentionRepository {

    private static final String BASE_QUERY = """
            WITH blr_outlets AS (
              SELECT o.id,
                     o.outlet_name,
                     o.license_type,
                     o.zone,
                     o.locality,
                     o.city,
                     o.state
              FROM outlets o
              WHERE o.is_active = TRUE
                AND o.city = :city
                AND o.state = :state
            ),
            outlet_scope AS (
              SELECT COUNT(*) AS outlet_count FROM blr_outlets
            ),
            candidate_dates AS (
              SELECT metric_date,
                     COUNT(DISTINCT outlet_id) AS covered_outlets
              FROM (
                SELECT stock_date AS metric_date, outlet_id FROM daily_stock
                UNION ALL
                SELECT sales_date AS metric_date, outlet_id FROM daily_sales
                UNION ALL
                SELECT upload_date AS metric_date, outlet_id FROM uploads
              ) d
              JOIN blr_outlets bo ON bo.id = d.outlet_id
              GROUP BY metric_date
            ),
            latest_business_date AS (
              SELECT COALESCE(
                (
                  SELECT cd.metric_date
                  FROM candidate_dates cd
                  CROSS JOIN outlet_scope os
                  WHERE cd.covered_outlets >= GREATEST(1, (os.outlet_count * 8) / 10)
                  ORDER BY cd.metric_date DESC, cd.covered_outlets DESC
                  LIMIT 1
                ),
                (
                  SELECT GREATEST(
                    COALESCE((SELECT MAX(stock_date) FROM daily_stock), DATE '1970-01-01'),
                    COALESCE((SELECT MAX(sales_date) FROM daily_sales), DATE '1970-01-01'),
                    COALESCE((SELECT MAX(upload_date) FROM uploads), DATE '1970-01-01'),
                    COALESCE((SELECT MAX(anomaly_date) FROM anomalies), DATE '1970-01-01')
                  )
                )
              ) AS business_date
            ),
            stock_latest AS (
              SELECT ds.outlet_id,
                     AVG(ABS(ds.variance_percent)) AS avg_stock_variance_percent
              FROM daily_stock ds
              JOIN latest_business_date l ON ds.stock_date = l.business_date
              GROUP BY ds.outlet_id
            ),
            sales_latest AS (
              SELECT ds.outlet_id,
                     SUM(ds.net_revenue) AS latest_revenue
              FROM daily_sales ds
              JOIN latest_business_date l ON ds.sales_date = l.business_date
              GROUP BY ds.outlet_id
            ),
            sales_prev_7d AS (
              SELECT x.outlet_id,
                     AVG(x.day_revenue) AS avg_prev7_revenue
              FROM (
                SELECT ds.outlet_id,
                       ds.sales_date,
                       SUM(ds.net_revenue) AS day_revenue
                FROM daily_sales ds
                GROUP BY ds.outlet_id, ds.sales_date
              ) x
              JOIN latest_business_date l ON x.sales_date BETWEEN l.business_date - 7 AND l.business_date - 1
              GROUP BY x.outlet_id
            ),
            late_uploads_7d AS (
              SELECT u.outlet_id,
                     COUNT(*) AS late_uploads_7d
              FROM uploads u
              JOIN latest_business_date l ON u.upload_date BETWEEN l.business_date - 6 AND l.business_date
              WHERE u.created_at::date > u.upload_date
              GROUP BY u.outlet_id
            ),
            uploads_today AS (
              SELECT u.outlet_id,
                     COUNT(*) AS uploads_today
              FROM uploads u
              JOIN latest_business_date l ON u.upload_date = l.business_date
              GROUP BY u.outlet_id
            ),
            correction_uploads_7d AS (
              SELECT u.outlet_id,
                     COUNT(*) AS correction_uploads_7d
              FROM uploads u
              JOIN latest_business_date l ON u.upload_date BETWEEN l.business_date - 6 AND l.business_date
              WHERE u.status = 'CORRECTED'
              GROUP BY u.outlet_id
            ),
            latest_upload_time AS (
              SELECT u.outlet_id,
                     MAX(u.created_at) AS last_upload_time
              FROM uploads u
              JOIN latest_business_date l ON u.upload_date <= l.business_date
              GROUP BY u.outlet_id
            ),
            anomalies_today AS (
              SELECT a.outlet_id,
                     COUNT(*) AS anomaly_count_today
              FROM anomalies a
              JOIN latest_business_date l ON a.anomaly_date = l.business_date
              WHERE a.status IN ('OPEN', 'ACKNOWLEDGED')
              GROUP BY a.outlet_id
            ),
            unresolved_30d AS (
              SELECT a.outlet_id,
                     COUNT(*) AS unresolved_count_30d
              FROM anomalies a
              JOIN latest_business_date l ON a.anomaly_date BETWEEN l.business_date - 30 AND l.business_date
              WHERE a.status IN ('OPEN', 'ACKNOWLEDGED')
              GROUP BY a.outlet_id
            ),
            risk_7d AS (
              SELECT r.outlet_id,
                     AVG(r.risk_score) AS avg_risk_score_7d,
                     MAX(CASE WHEN r.risk_date = l.business_date THEN r.risk_score ELSE NULL END) AS risk_score_latest_day
              FROM v_outlet_daily_risk r
              JOIN latest_business_date l ON r.risk_date BETWEEN l.business_date - 6 AND l.business_date
              GROUP BY r.outlet_id
            )
            SELECT o.id AS outlet_id,
                   o.outlet_name,
                   o.license_type,
                   o.zone,
                   o.locality,
                   o.city,
                   o.state,
                   l.business_date,
                   COALESCE(st.avg_stock_variance_percent, 0) AS stock_variance_percent,
                   COALESCE(sl.latest_revenue, 0) AS latest_revenue,
                   COALESCE(sp.avg_prev7_revenue, 0) AS avg_prev7_revenue,
                   COALESCE(lu.late_uploads_7d, 0) AS late_uploads_7d,
                   COALESCE(ut.uploads_today, 0) AS uploads_today,
                   COALESCE(cu.correction_uploads_7d, 0) AS correction_uploads_7d,
                   COALESCE(at.anomaly_count_today, 0) AS anomaly_count_today,
                   COALESCE(ur.unresolved_count_30d, 0) AS unresolved_count_30d,
                   COALESCE(r7.avg_risk_score_7d, 0) AS avg_risk_score_7d,
                   COALESCE(r7.risk_score_latest_day, 0) AS risk_score_latest_day,
                   lt.last_upload_time
            FROM blr_outlets o
            CROSS JOIN latest_business_date l
            LEFT JOIN stock_latest st ON st.outlet_id = o.id
            LEFT JOIN sales_latest sl ON sl.outlet_id = o.id
            LEFT JOIN sales_prev_7d sp ON sp.outlet_id = o.id
            LEFT JOIN late_uploads_7d lu ON lu.outlet_id = o.id
            LEFT JOIN uploads_today ut ON ut.outlet_id = o.id
            LEFT JOIN correction_uploads_7d cu ON cu.outlet_id = o.id
            LEFT JOIN anomalies_today at ON at.outlet_id = o.id
            LEFT JOIN unresolved_30d ur ON ur.outlet_id = o.id
            LEFT JOIN risk_7d r7 ON r7.outlet_id = o.id
            LEFT JOIN latest_upload_time lt ON lt.outlet_id = o.id
            """;

    private static final RowMapper<AttentionMetricsRow> ROW_MAPPER = (rs, rowNum) -> new AttentionMetricsRow(
            rs.getString("outlet_id"),
            rs.getString("outlet_name"),
            rs.getString("license_type"),
            rs.getString("zone"),
            rs.getString("locality"),
            rs.getString("city"),
            rs.getString("state"),
            Optional.ofNullable(rs.getDate("business_date")).map(Date::toLocalDate).orElse(LocalDate.of(1970, 1, 1)),
            rs.getBigDecimal("stock_variance_percent"),
            rs.getBigDecimal("latest_revenue"),
            rs.getBigDecimal("avg_prev7_revenue"),
            rs.getInt("late_uploads_7d"),
            rs.getInt("uploads_today"),
            rs.getInt("correction_uploads_7d"),
            rs.getInt("anomaly_count_today"),
            rs.getInt("unresolved_count_30d"),
            rs.getBigDecimal("avg_risk_score_7d"),
            rs.getBigDecimal("risk_score_latest_day"),
            rs.getObject("last_upload_time", OffsetDateTime.class)
    );

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AttentionRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AttentionMetricsRow> fetchDailyAttentionRows(String city, String state) {
        String query = BASE_QUERY + " ORDER BY o.zone, o.locality, o.outlet_name";
        return jdbcTemplate.query(query, new MapSqlParameterSource()
                .addValue("city", city)
                .addValue("state", state), ROW_MAPPER);
    }

    public Optional<AttentionMetricsRow> fetchDailyAttentionRowByOutlet(String outletId, String city, String state) {
        String query = BASE_QUERY + " WHERE CAST(o.id AS text) = :outletId";
        List<AttentionMetricsRow> rows = jdbcTemplate.query(query, new MapSqlParameterSource()
                .addValue("outletId", outletId)
                .addValue("city", city)
                .addValue("state", state), ROW_MAPPER);
        return rows.stream().findFirst();
    }

    public record AttentionMetricsRow(
            String outletId,
            String outletName,
            String licenseType,
            String zone,
            String locality,
            String city,
            String state,
            LocalDate businessDate,
            BigDecimal stockVariancePercent,
            BigDecimal latestRevenue,
            BigDecimal avgPrev7Revenue,
            int lateUploads7d,
            int uploadsToday,
            int correctionUploads7d,
            int anomalyCountToday,
            int unresolvedCount30d,
            BigDecimal avgRiskScore7d,
            BigDecimal riskScoreLatestDay,
            OffsetDateTime lastUploadTime
    ) {
    }
}
