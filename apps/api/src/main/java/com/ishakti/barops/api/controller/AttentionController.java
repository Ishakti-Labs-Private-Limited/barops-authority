package com.ishakti.barops.api.controller;

import com.ishakti.barops.api.dto.OutletAttentionDto;
import com.ishakti.barops.api.service.AttentionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

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
}
