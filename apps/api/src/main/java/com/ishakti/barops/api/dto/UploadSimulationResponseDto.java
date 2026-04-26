package com.ishakti.barops.api.dto;

import java.util.List;

public record UploadSimulationResponseDto(
        String simulationId,
        String sourceType,
        String fileName,
        int totalRows,
        int acceptedRows,
        int rejectedRows,
        List<String> highlights,
        String recalculationNote,
        String status
) {
}
