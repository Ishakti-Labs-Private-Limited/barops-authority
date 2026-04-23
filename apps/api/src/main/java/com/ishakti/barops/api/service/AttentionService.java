package com.ishakti.barops.api.service;

import com.ishakti.barops.api.dto.OutletAttentionDto;
import com.ishakti.barops.api.repository.AttentionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class AttentionService {

    private static final String DEFAULT_CITY = "Bengaluru";
    private static final String DEFAULT_STATE = "Karnataka";
    private static final int BASE_RISK_SCORE = 10;

    private final AttentionRepository attentionRepository;

    public AttentionService(AttentionRepository attentionRepository) {
        this.attentionRepository = attentionRepository;
    }

    public List<OutletAttentionDto> getDailyAttention() {
        return attentionRepository.fetchDailyAttentionRows(DEFAULT_CITY, DEFAULT_STATE).stream()
                .map(this::evaluateRow)
                .sorted(Comparator.comparingInt(OutletAttentionDto::riskScore).reversed())
                .toList();
    }

    public Optional<OutletAttentionDto> getOutletAttention(String outletId) {
        return attentionRepository.fetchDailyAttentionRowByOutlet(outletId, DEFAULT_CITY, DEFAULT_STATE)
                .map(this::evaluateRow);
    }

    private OutletAttentionDto evaluateRow(AttentionRepository.AttentionMetricsRow row) {
        int score = BASE_RISK_SCORE;
        List<String> reasons = new java.util.ArrayList<>();

        BigDecimal stockVariance = nullSafe(row.stockVariancePercent());
        BigDecimal avgPrev7Revenue = nullSafe(row.avgPrev7Revenue());
        BigDecimal latestRevenue = nullSafe(row.latestRevenue());
        int salesDropPercent = computeDropPercent(avgPrev7Revenue, latestRevenue);
        int historicalRisk = nullSafe(row.avgRiskScore7d()).setScale(0, RoundingMode.HALF_UP).intValue();

        if (stockVariance.compareTo(BigDecimal.valueOf(7)) >= 0) {
            score += 20;
            reasons.add("Expected vs reported stock variance is %.1f%%".formatted(stockVariance.doubleValue()));
        } else if (stockVariance.compareTo(BigDecimal.valueOf(3)) >= 0) {
            score += 10;
            reasons.add("Expected vs reported stock variance is %.1f%%".formatted(stockVariance.doubleValue()));
        }

        if (salesDropPercent >= 35) {
            score += 14;
            reasons.add("Top-line revenue dropped %d%% against recent baseline".formatted(salesDropPercent));
        } else if (salesDropPercent >= 20) {
            score += 8;
            reasons.add("Revenue is %d%% below the recent baseline".formatted(salesDropPercent));
        }

        if (row.lateUploads7d() >= 4) {
            score += 12;
            reasons.add("%d late uploads in the last 7 days".formatted(row.lateUploads7d()));
        } else if (row.lateUploads7d() >= 2) {
            score += 6;
            reasons.add("%d late uploads in the last 7 days".formatted(row.lateUploads7d()));
        }

        if (row.uploadsToday() == 0) {
            score += 18;
            reasons.add("No required daily upload was received for the latest business date");
        }

        if (row.anomalyCountToday() >= 5) {
            score += 16;
            reasons.add("%d open anomalies detected today".formatted(row.anomalyCountToday()));
        } else if (row.anomalyCountToday() >= 2) {
            score += 8;
            reasons.add("%d open anomalies detected today".formatted(row.anomalyCountToday()));
        }

        if (row.unresolvedCount30d() >= 6) {
            score += 14;
            reasons.add("%d unresolved anomalies in the last 30 days".formatted(row.unresolvedCount30d()));
        } else if (row.unresolvedCount30d() >= 3) {
            score += 7;
            reasons.add("%d unresolved anomalies in the last 30 days".formatted(row.unresolvedCount30d()));
        }

        if (historicalRisk >= 70) {
            score += 16;
            reasons.add("Risk has remained elevated over the past week");
        } else if (historicalRisk >= 45) {
            score += 8;
            reasons.add("Risk is trending above normal over the past week");
        }

        if (reasons.isEmpty()) {
            reasons.add("No material anomalies detected for the latest business date");
        }

        int riskScore = clampScore(score);
        int trendDelta = riskScore - historicalRisk;
        String trendDirection = trendDelta >= 10 ? "UP"
                : trendDelta <= -10 ? "DOWN" : "STABLE";
        String managementSummary = buildManagementSummary(reasons, trendDirection, row.uploadsToday());

        return new OutletAttentionDto(
                row.outletId(),
                row.outletName(),
                row.licenseType(),
                row.zone(),
                row.locality(),
                row.city(),
                row.state(),
                row.businessDate().toString(),
                riskScore,
                attentionBand(riskScore),
                reasons.stream().limit(3).toList(),
                managementSummary,
                row.anomalyCountToday(),
                trendDirection,
                trendDelta
        );
    }

    private static int computeDropPercent(BigDecimal baseline, BigDecimal latest) {
        if (baseline.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        BigDecimal ratio = baseline.subtract(latest)
                .divide(baseline, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        return Math.max(0, ratio.setScale(0, RoundingMode.HALF_UP).intValue());
    }

    private static int clampScore(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private static String attentionBand(int riskScore) {
        if (riskScore >= 75) {
            return "RED";
        }
        if (riskScore >= 45) {
            return "AMBER";
        }
        return "GREEN";
    }

    private static String buildManagementSummary(List<String> reasons, String trendDirection, int uploadsToday) {
        String core = reasons.stream().limit(2).reduce((a, b) -> a + ". " + b).orElse("No material anomalies detected");
        String uploadConfidence = uploadsToday == 0
                ? "Data completeness is low due to missing upload."
                : "Data completeness is acceptable for daily review.";
        return "%s. Trend %s versus recent period. %s".formatted(core, trendDirection, uploadConfidence);
    }

    private static BigDecimal nullSafe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
