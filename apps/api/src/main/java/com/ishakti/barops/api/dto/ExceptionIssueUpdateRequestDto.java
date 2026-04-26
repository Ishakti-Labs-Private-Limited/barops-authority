package com.ishakti.barops.api.dto;

public record ExceptionIssueUpdateRequestDto(
        String status,
        String owner,
        String dueDate,
        String closureNote
) {
}
