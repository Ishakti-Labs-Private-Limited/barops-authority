package com.ishakti.barops.api.service;

import com.ishakti.barops.api.dto.ExceptionIssueDto;
import com.ishakti.barops.api.dto.ExceptionIssueUpdateRequestDto;
import com.ishakti.barops.api.dto.OutletAttentionDto;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ExceptionWorkflowService {

    private final AttentionService attentionService;
    private final Map<String, ExceptionState> issueStore = new ConcurrentHashMap<>();

    public ExceptionWorkflowService(AttentionService attentionService) {
        this.attentionService = attentionService;
    }

    public List<ExceptionIssueDto> getIssuesForOutlet(String outletId) {
        OutletAttentionDto outlet = attentionService.getOutletAttention(outletId).orElse(null);
        if (outlet == null) {
            return List.of();
        }

        List<ExceptionIssueDto> issues = new ArrayList<>();
        for (int index = 0; index < outlet.reasons().size(); index++) {
            String reason = outlet.reasons().get(index);
            int reasonIndex = index;
            String issueId = buildIssueId(outletId, reason, index);
            ExceptionState state = issueStore.computeIfAbsent(issueId, key -> defaultState(reasonIndex, reason));
            issues.add(toDto(issueId, outlet.outletId(), outlet.outletName(), reason, state));
        }

        return issues.stream()
                .sorted(Comparator.comparing(ExceptionIssueDto::dueDate, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public ExceptionIssueDto updateIssue(String issueId, ExceptionIssueUpdateRequestDto request) {
        ExceptionState existing = issueStore.get(issueId);
        if (existing == null) {
            throw new IllegalArgumentException("Issue not found for issueId=" + issueId);
        }

        String nextStatus = normalizeStatus(request.status(), existing.status);
        existing.status = nextStatus;
        if (request.owner() != null && !request.owner().isBlank()) {
            existing.owner = request.owner();
        }
        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            existing.dueDate = request.dueDate();
        }
        if (request.closureNote() != null) {
            existing.closureNote = request.closureNote();
        }
        if ("CLOSED".equals(nextStatus) && (existing.closureNote == null || existing.closureNote.isBlank())) {
            existing.closureNote = "Closed in demo workflow.";
        }

        OutletAttentionDto outlet = attentionService.getDailyAttention().stream()
                .filter(row -> issueId.startsWith(row.outletId()))
                .findFirst()
                .orElse(null);
        String outletId = outlet == null ? "unknown" : outlet.outletId();
        String outletName = outlet == null ? "Unknown outlet" : outlet.outletName();
        return toDto(issueId, outletId, outletName, existing.issueTitle, existing);
    }

    public int getOverdueOpenIssueCount() {
        return (int) getAllIssues().stream()
                .filter(issue -> !"CLOSED".equals(issue.status()) && issue.overdue())
                .count();
    }

    public List<ExecutiveRepeatedIssue> getRepeatedUnresolvedOutlets() {
        Map<String, List<ExceptionIssueDto>> byOutlet = getAllIssues().stream()
                .filter(issue -> !"CLOSED".equals(issue.status()))
                .collect(java.util.stream.Collectors.groupingBy(ExceptionIssueDto::outletName));

        return byOutlet.entrySet().stream()
                .map(entry -> {
                    int repeated = (int) entry.getValue().stream().filter(issue -> issue.repeatCount() >= 2).count();
                    return new ExecutiveRepeatedIssue(entry.getKey(), repeated, entry.getValue().size());
                })
                .filter(item -> item.repeatedIssueCount() > 0)
                .sorted(Comparator.comparingInt(ExecutiveRepeatedIssue::repeatedIssueCount).reversed())
                .limit(5)
                .toList();
    }

    private List<ExceptionIssueDto> getAllIssues() {
        List<ExceptionIssueDto> issues = new ArrayList<>();
        for (OutletAttentionDto row : attentionService.getDailyAttention()) {
            issues.addAll(getIssuesForOutlet(row.outletId()));
        }
        return issues;
    }

    private static String buildIssueId(String outletId, String reason, int index) {
        String normalized = reason.toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return outletId + "__" + normalized + "_" + index;
    }

    private static ExceptionState defaultState(int index, String reason) {
        LocalDate dueDate = LocalDate.now().plusDays(index == 0 ? 1 : index == 1 ? 2 : 3);
        if (reason.toLowerCase().contains("unresolved")) {
            dueDate = LocalDate.now().minusDays(1);
        }
        String owner = index == 0 ? "Outlet Manager" : index == 1 ? "Regional Supervisor" : "Ops Controller";
        int repeatCount = reason.toLowerCase().contains("unresolved") ? 3 : reason.toLowerCase().contains("upload") ? 2 : 1;
        return new ExceptionState(reason, "OPEN", owner, dueDate.toString(), "", repeatCount);
    }

    private static ExceptionIssueDto toDto(
            String issueId,
            String outletId,
            String outletName,
            String issueTitle,
            ExceptionState state
    ) {
        boolean overdue = false;
        if (state.dueDate != null && !state.dueDate.isBlank() && !"CLOSED".equals(state.status)) {
            overdue = LocalDate.parse(state.dueDate).isBefore(LocalDate.now());
        }
        return new ExceptionIssueDto(
                issueId,
                outletId,
                outletName,
                issueTitle,
                state.status,
                state.owner,
                state.dueDate,
                state.closureNote,
                state.repeatCount,
                overdue
        );
    }

    private static String normalizeStatus(String requested, String fallback) {
        if (requested == null || requested.isBlank()) {
            return fallback;
        }
        return switch (requested.toUpperCase()) {
            case "OPEN", "ACKNOWLEDGED", "CLOSED" -> requested.toUpperCase();
            default -> fallback;
        };
    }

    private static final class ExceptionState {
        private final String issueTitle;
        private String status;
        private String owner;
        private String dueDate;
        private String closureNote;
        private final int repeatCount;

        private ExceptionState(String issueTitle, String status, String owner, String dueDate, String closureNote, int repeatCount) {
            this.issueTitle = issueTitle;
            this.status = status;
            this.owner = owner;
            this.dueDate = dueDate;
            this.closureNote = closureNote;
            this.repeatCount = repeatCount;
        }
    }

    public record ExecutiveRepeatedIssue(
            String outletName,
            int repeatedIssueCount,
            int unresolvedIssueCount
    ) {
    }
}
