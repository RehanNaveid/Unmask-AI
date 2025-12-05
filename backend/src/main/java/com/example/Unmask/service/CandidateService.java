package com.example.Unmask.service;
import com.example.Unmask.dto.CandidateDTO;
import com.example.Unmask.entity.Candidate;
import com.example.Unmask.entity.CandidateFacts;
import com.example.Unmask.entity.CouncilResult;
import com.example.Unmask.repository.CandidateFactsRepository;
import com.example.Unmask.repository.CandidateRepository;
import com.example.Unmask.repository.CouncilResultRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateFactsRepository candidateFactsRepository;
    private final CouncilResultRepository councilResultRepository;
    private final SupabaseStorageService storageService;
    private final ProcessingService processingService;

    // Jackson mapper for JSON <-> Map
    private final ObjectMapper mapper = new ObjectMapper();

    public CandidateDTO createAndStartProcessing(
            String name,
            String email,
            String githubUsername,
            MultipartFile cvFile,
            MultipartFile linkedinFile
    ) {
        Candidate candidate = Candidate.builder()
                .name(name)
                .email(email)
                .githubUsername(githubUsername)
                .status("CREATED")
                .build();
        candidateRepository.save(candidate);

        try {
            String cvPath = storageService.uploadCv(candidate.getId(), cvFile);
            candidate.setCvPath(cvPath);

            if (linkedinFile != null && !linkedinFile.isEmpty()) {
                String linkedinPath = storageService.uploadLinkedin(candidate.getId(), linkedinFile);
                candidate.setLinkedinPath(linkedinPath);
            }

            candidate.setStatus("UPLOADED");
            candidateRepository.save(candidate);

            processingService.processCandidateAsync(candidate.getId());

            return CandidateDTO.fromEntity(candidate, null, null);
        } catch (Exception e) {
            log.error("Failed to create candidate", e);
            candidate.setStatus("FAILED");
            candidateRepository.save(candidate);
            throw new RuntimeException("Failed to create candidate: " + e.getMessage());
        }
    }

    public CandidateDTO getCandidate(UUID id) {
        Candidate c = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        Map<String, Object> factsMap = null;
        Map<String, Object> councilMap = null;

        // load latest facts
        if (c.getLatestFactId() != null) {
            CandidateFacts facts = candidateFactsRepository.findById(c.getLatestFactId())
                    .orElse(null);
            if (facts != null) {
                try {
                    factsMap = mapper.readValue(
                            facts.getFactsJson(),
                            new TypeReference<Map<String, Object>>() {}
                    );
                } catch (Exception e) {
                    log.warn("Failed to parse facts JSON", e);
                }
            }
        }

        // load latest council result
        if (c.getLatestCouncilResultId() != null) {
            CouncilResult cr = councilResultRepository.findById(c.getLatestCouncilResultId())
                    .orElse(null);
            if (cr != null) {
                try {
                    councilMap = mapper.readValue(
                            cr.getResultJson(),
                            new TypeReference<Map<String, Object>>() {}
                    );
                } catch (Exception e) {
                    log.warn("Failed to parse council JSON", e);
                }
            }
        }

        return CandidateDTO.fromEntity(c, factsMap, councilMap);
    }
}
