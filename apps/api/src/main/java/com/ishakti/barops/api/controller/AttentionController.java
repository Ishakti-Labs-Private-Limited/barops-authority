package com.ishakti.barops.api.controller;

import com.ishakti.barops.api.dto.OutletAttentionDto;
import com.ishakti.barops.api.dto.ExecutiveSummaryDto;
import com.ishakti.barops.api.service.AttentionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/v1")
public class AttentionController {

    private final AttentionService attentionService;

    public AttentionController(AttentionService attentionService) {
        this.attentionService = attentionService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "barops-api");
    }

    @GetMapping("/attention")
    public List<OutletAttentionDto> getAttention() {
        return attentionService.getDailyAttention();
    }

    @GetMapping("/attention/{outletId}")
    public OutletAttentionDto getOutletAttention(@PathVariable String outletId) {
        return attentionService.getOutletAttention(outletId)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "Outlet attention not found for outletId=%s".formatted(outletId)
                ));
    }

    @GetMapping("/executive-summary/weekly")
    public ExecutiveSummaryDto getWeeklyExecutiveSummary() {
        return attentionService.getWeeklyExecutiveSummary();
    }
}
