package com.example.Unmask.controller;
import com.example.Unmask.dto.CandidateAnalysisDTO;
import com.example.Unmask.dto.CandidateDTO;
import com.example.Unmask.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CandidateDTO> createCandidate(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam("github_username") String githubUsername,
            @RequestParam("cv") MultipartFile cvFile,
            @RequestParam(value = "linkedin", required = false) MultipartFile linkedinFile
    ) {
        CandidateDTO dto = candidateService.createAndStartProcessing(
                name, email, githubUsername, cvFile, linkedinFile
        );
        return ResponseEntity.accepted().body(dto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidateDTO> getCandidate(@PathVariable UUID id) {
        return ResponseEntity.ok(candidateService.getCandidate(id));
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<CandidateAnalysisDTO> getCandidateAnalysis(@PathVariable UUID id) {
        CandidateAnalysisDTO dto = candidateService.getCandidateAnalysis(id);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable UUID id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }

}

