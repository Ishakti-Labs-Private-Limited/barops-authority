package com.ishakti.barops.api.dto;

import java.util.List;

public record OutletAttentionDto(
        String outletId,
        String outletName,
        String city,
        String state,
        int riskScore,
        List<String> reasons
) {
}
