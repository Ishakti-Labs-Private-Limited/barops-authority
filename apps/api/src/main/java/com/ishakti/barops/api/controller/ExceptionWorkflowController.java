package com.ishakti.barops.api.controller;

import com.ishakti.barops.api.dto.ExceptionExecutiveSummaryDto;
import com.ishakti.barops.api.dto.ExceptionIssueDto;
import com.ishakti.barops.api.dto.ExceptionIssueUpdateRequestDto;
import com.ishakti.barops.api.service.ExceptionWorkflowService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/exceptions")
public class ExceptionWorkflowController {

    private final ExceptionWorkflowService exceptionWorkflowService;

    public ExceptionWorkflowController(ExceptionWorkflowService exceptionWorkflowService) {
        this.exceptionWorkflowService = exceptionWorkflowService;
    }

    @GetMapping("/outlets/{outletId}")
    public List<ExceptionIssueDto> getOutletIssues(@PathVariable String outletId) {
        return exceptionWorkflowService.getIssuesForOutlet(outletId);
    }

    @PutMapping("/{issueId}")
    public ExceptionIssueDto updateIssue(
            @PathVariable String issueId,
            @RequestBody ExceptionIssueUpdateRequestDto request
    ) {
        return exceptionWorkflowService.updateIssue(issueId, request);
    }

    @GetMapping("/summary")
    public ExceptionExecutiveSummaryDto getExceptionExecutiveSummary() {
        List<ExceptionExecutiveSummaryDto.RepeatedUnresolvedOutletDto> repeated = exceptionWorkflowService
                .getRepeatedUnresolvedOutlets().stream()
                .map(item -> new ExceptionExecutiveSummaryDto.RepeatedUnresolvedOutletDto(
                        item.outletName(),
                        item.repeatedIssueCount(),
                        item.unresolvedIssueCount()
                ))
                .toList();

        return new ExceptionExecutiveSummaryDto(
                exceptionWorkflowService.getOverdueOpenIssueCount(),
                repeated
        );
    }
}
