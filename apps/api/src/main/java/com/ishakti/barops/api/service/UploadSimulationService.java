package com.ishakti.barops.api.service;

import com.ishakti.barops.api.dto.UploadSimulationRequestDto;
import com.ishakti.barops.api.dto.UploadSimulationResponseDto;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class UploadSimulationService {

    public UploadSimulationResponseDto simulateUpload(UploadSimulationRequestDto request) {
        int acceptedRows = Math.max(0, request.validRows());
        int rejectedRows = Math.max(0, request.invalidRows());
        int totalRows = Math.max(request.totalRows(), acceptedRows + rejectedRows);

        List<String> highlights = new ArrayList<>();
        highlights.add("Source type: " + defaultString(request.sourceType(), "manual_sheet"));
        highlights.add("Mapped columns: " + (request.columnMapping() == null ? 0 : request.columnMapping().size()));
        highlights.add("Preview rows supplied: " + (request.previewRows() == null ? 0 : request.previewRows().size()));
        if (rejectedRows > 0) {
            highlights.add("Validation rejected " + rejectedRows + " row(s). Review and correct before final ingestion.");
        } else {
            highlights.add("No validation failures in the uploaded sample.");
        }

        String simulationId = "sim-" + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String recalculationNote = acceptedRows > 0
                ? "If promoted to live ingestion, attention scores will be recalculated for impacted outlets."
                : "No valid rows were accepted, so no attention-score recalculation is triggered.";

        return new UploadSimulationResponseDto(
                simulationId,
                defaultString(request.sourceType(), "manual_sheet"),
                defaultString(request.fileName(), "upload.csv"),
                totalRows,
                acceptedRows,
                rejectedRows,
                highlights,
                recalculationNote,
                "SIMULATED"
        );
    }

    private static String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
