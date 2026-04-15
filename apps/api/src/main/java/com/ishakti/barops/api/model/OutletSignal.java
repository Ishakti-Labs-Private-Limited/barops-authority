package com.ishakti.barops.api.model;

public record OutletSignal(
        String outletId,
        String outletCode,
        String outletName,
        String city,
        String state,
        SignalSource source,
        String date,
        double cashVariancePercent,
        int lateOpeningCount7d,
        double stockVariancePercent,
        int managerOverrideCount7d
) {
}
