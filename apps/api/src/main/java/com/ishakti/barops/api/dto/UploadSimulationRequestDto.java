package com.ishakti.barops.api.dto;

import java.util.List;
import java.util.Map;

public record UploadSimulationRequestDto(
        String sourceType,
        String fileName,
        int totalRows,
        int validRows,
        int invalidRows,
        Map<String, String> columnMapping,
        List<Map<String, String>> previewRows,
        List<String> validationErrors
) {
}
