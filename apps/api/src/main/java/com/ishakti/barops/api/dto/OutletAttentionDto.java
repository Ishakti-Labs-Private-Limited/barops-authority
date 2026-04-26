package com.ishakti.barops.api.dto;

import java.util.List;

public record OutletAttentionDto(
        String outletId,
        String outletName,
        String licenseType,
        String zone,
        String locality,
        String city,
        String state,
        String businessDate,
        int riskScore,
        String attentionBand,
        List<String> reasons,
        String managementSummary,
        int anomalyCount,
        String trendDirection,
        int trendDelta,
        int closeConfidenceScore,
        boolean missingUploadToday,
        int lateUploadCount7d,
        int postCloseCorrectionCount7d,
        int recentUnresolvedIssueCount,
        String uploadTimelinessStatus,
        String lastUploadTime,
        String complianceNote
) {
}
