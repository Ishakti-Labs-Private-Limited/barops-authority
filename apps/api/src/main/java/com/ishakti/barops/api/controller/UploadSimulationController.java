package com.ishakti.barops.api.controller;

import com.ishakti.barops.api.dto.UploadSimulationRequestDto;
import com.ishakti.barops.api.dto.UploadSimulationResponseDto;
import com.ishakti.barops.api.service.UploadSimulationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadSimulationController {

    private final UploadSimulationService uploadSimulationService;

    public UploadSimulationController(UploadSimulationService uploadSimulationService) {
        this.uploadSimulationService = uploadSimulationService;
    }

    @PostMapping("/simulate")
    public UploadSimulationResponseDto simulateUpload(@RequestBody UploadSimulationRequestDto request) {
        return uploadSimulationService.simulateUpload(request);
    }
}
