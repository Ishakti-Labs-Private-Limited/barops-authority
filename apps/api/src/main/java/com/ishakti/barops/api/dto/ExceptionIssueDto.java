package com.ishakti.barops.api.dto;

public record ExceptionIssueDto(
        String issueId,
        String outletId,
        String outletName,
        String issueTitle,
        String status,
        String owner,
        String dueDate,
        String closureNote,
        int repeatCount,
        boolean overdue,
        boolean slaAtRisk,
        String lastUpdatedAt,
        String lastStatusChangeAt,
        boolean closureNoteAdded
) {
}
