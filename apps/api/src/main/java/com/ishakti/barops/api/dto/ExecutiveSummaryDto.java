package com.ishakti.barops.api.dto;

import java.util.List;

public record ExecutiveSummaryDto(
        String weekStartDate,
        String weekEndDate,
        int totalOutletsMonitored,
        int redOutlets,
        int amberOutlets,
        int greenOutlets,
        List<TopRiskOutletDto> topRiskOutlets,
        List<IssuePatternDto> repeatedIssuePatterns,
        List<ZoneRiskSummaryDto> zoneRiskSummary,
        List<TopRiskOutletDto> outletsRequiringImmediateVisit,
        int lowConfidenceOutlets,
        List<TopRiskOutletDto> lowConfidenceOutletList,
        int repeatedLateOrMissingPatterns,
        List<String> managementRecommendations
) {
    public record TopRiskOutletDto(
            String outletId,
            String outletName,
            String zone,
            String locality,
            int riskScore,
            int anomalyCount,
            int closeConfidenceScore,
            List<String> reasons
    ) {
    }

    public record IssuePatternDto(
            String issue,
            int affectedOutlets
    ) {
    }

    public record ZoneRiskSummaryDto(
            String zone,
            int outlets,
            int avgRiskScore,
            int redOutlets,
            int amberOutlets,
            int greenOutlets
    ) {
    }
}
