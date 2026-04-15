package com.ishakti.barops.api.service;

import com.ishakti.barops.api.dto.OutletAttentionDto;
import com.ishakti.barops.api.model.OutletSignal;
import com.ishakti.barops.api.model.SignalSource;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class AttentionService {

    public List<OutletAttentionDto> getDailyAttention() {
        return demoSignals().stream()
                .map(this::evaluateSignal)
                .sorted(Comparator.comparingInt(OutletAttentionDto::riskScore).reversed())
                .toList();
    }

    private OutletAttentionDto evaluateSignal(OutletSignal signal) {
        double score = 10;
        List<String> reasons = new java.util.ArrayList<>();

        if (signal.cashVariancePercent() > 3) {
            score += signal.cashVariancePercent() * 6;
            reasons.add("Cash variance %.1f%%".formatted(signal.cashVariancePercent()));
        }

        if (signal.stockVariancePercent() > 2) {
            score += signal.stockVariancePercent() * 7;
            reasons.add("Stock variance %.1f%%".formatted(signal.stockVariancePercent()));
        }

        if (signal.lateOpeningCount7d() >= 2) {
            score += signal.lateOpeningCount7d() * 5;
            reasons.add("%d late openings in 7 days".formatted(signal.lateOpeningCount7d()));
        }

        if (signal.managerOverrideCount7d() >= 4) {
            score += signal.managerOverrideCount7d() * 4;
            reasons.add("%d manager overrides in 7 days".formatted(signal.managerOverrideCount7d()));
        }

        if (reasons.isEmpty()) {
            reasons.add("No material anomalies detected");
        }

        int riskScore = Math.max(0, Math.min(100, (int) Math.round(score)));
        return new OutletAttentionDto(
                signal.outletId(),
                signal.outletName(),
                signal.city(),
                signal.state(),
                riskScore,
                reasons
        );
    }

    private List<OutletSignal> demoSignals() {
        return List.of(
                new OutletSignal(
                        "a6f40d49-6bae-4f13-a20b-9b1375d8e101",
                        "BLR-IND-001",
                        "MG Road Premium Spirits",
                        "Bengaluru",
                        "Karnataka",
                        SignalSource.POS,
                        "2026-04-14",
                        4.2,
                        3,
                        2.9,
                        5
                ),
                new OutletSignal(
                        "b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0",
                        "PUN-MH-014",
                        "Baner Cellars",
                        "Pune",
                        "Maharashtra",
                        SignalSource.EXCEL,
                        "2026-04-14",
                        1.2,
                        1,
                        3.8,
                        6
                ),
                new OutletSignal(
                        "0e2f8f31-3968-4ea2-84aa-7bbfdb2152a8",
                        "HYD-TG-022",
                        "Jubilee Hills Reserve",
                        "Hyderabad",
                        "Telangana",
                        SignalSource.MANUAL_UPLOAD,
                        "2026-04-14",
                        2.1,
                        0,
                        1.1,
                        1
                )
        );
    }
}
