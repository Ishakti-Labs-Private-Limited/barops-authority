package com.ishakti.barops.api.dto;

import java.util.List;

public record ExceptionExecutiveSummaryDto(
        int overdueOpenIssues,
        int closureSlaAtRisk,
        List<RepeatedUnresolvedOutletDto> repeatedUnresolvedOutlets
) {
    public record RepeatedUnresolvedOutletDto(
            String outletName,
            int repeatedIssueCount,
            int unresolvedIssueCount
    ) {
    }
}
