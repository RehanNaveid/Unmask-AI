package com.example.Unmask.service;

import com.example.Unmask.dto.CandidateAnalysisDTO;
import com.example.Unmask.dto.CandidateDTO;
import com.example.Unmask.entity.Candidate;
import com.example.Unmask.entity.CandidateFacts;
import com.example.Unmask.entity.CouncilResult;
import com.example.Unmask.entity.HrUser;
import com.example.Unmask.repository.CandidateFactsRepository;
import com.example.Unmask.repository.CandidateRepository;
import com.example.Unmask.repository.CouncilResultRepository;
import com.example.Unmask.repository.HrUserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateFactsRepository candidateFactsRepository;
    private final CouncilResultRepository councilResultRepository;
    private final HrUserRepository hrUserRepository;
    private final SupabaseStorageService storageService;
    private final ProcessingService processingService;

    // Jackson mapper for JSON <-> Map
    private final ObjectMapper mapper = new ObjectMapper();

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private HrUser currentHr() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Unauthenticated");
        }
        String email = auth.getName();
        return hrUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("HR user not found"));
    }

    // ---------------------------------------------------------------------
    // Create + start processing
    // ---------------------------------------------------------------------

    public CandidateDTO createAndStartProcessing(
            String name,
            String email,
            String githubUsername,
            MultipartFile cvFile,
            MultipartFile linkedinFile
    ) {
        HrUser hr = currentHr();

        Candidate candidate = Candidate.builder()
                .name(name)
                .email(email)
                .githubUsername(githubUsername)
                .status("CREATED")
                .hrUser(hr)
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

    // ---------------------------------------------------------------------
    // Get single candidate (owned by current HR)
    // ---------------------------------------------------------------------

    public CandidateDTO getCandidate(UUID id) {
        HrUser hr = currentHr();

        Candidate c = candidateRepository.findByIdAndHrUser(id, hr)
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

    // ---------------------------------------------------------------------
    // Get final analysis (stage3 + top repos) for owned candidate
    // ---------------------------------------------------------------------

    public CandidateAnalysisDTO getCandidateAnalysis(UUID id) {
        HrUser hr = currentHr();

        Candidate c = candidateRepository.findByIdAndHrUser(id, hr)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        if (c.getLatestCouncilResultId() == null) {
            throw new RuntimeException("Analysis not ready yet");
        }

        CouncilResult cr = councilResultRepository.findById(c.getLatestCouncilResultId())
                .orElseThrow(() -> new RuntimeException("Council result not found"));

        Map<String,Object> councilMap;
        try {
            councilMap = mapper.readValue(
                    cr.getResultJson(),
                    new TypeReference<Map<String,Object>>() {}
            );
        } catch (Exception e) {
            log.warn("Failed to parse council JSON", e);
            throw new RuntimeException("Invalid council JSON");
        }

        Map<String,Object> stage3 =
                (Map<String,Object>) councilMap.getOrDefault("stage3", Map.of());

        String label = (String) stage3.getOrDefault("label", "");
        double score = ((Number) stage3.getOrDefault("score", 0)).doubleValue();
        List<String> redFlags =
                (List<String>) stage3.getOrDefault("red_flags", List.of());
        List<String> yellowFlags =
                (List<String>) stage3.getOrDefault("yellow_flags", List.of());
        String explanation = (String) stage3.getOrDefault("explanation", "");
        String recommendation = (String) stage3.getOrDefault("recommendation", "");
        Map<String,Object> languageAlignment =
                (Map<String,Object>) stage3.getOrDefault("language_alignment", Map.of());
        List<String> suggestedQuestions =
                (List<String>) stage3.getOrDefault("suggested_questions", List.of());
        List<String> consolidatedReasons =
                (List<String>) stage3.getOrDefault("consolidated_reasons", List.of());
        List<Map<String,Object>> projectVerification =
                (List<Map<String,Object>>) stage3.getOrDefault("project_verification", List.of());

        // top repos from latest facts
        List<Map<String,Object>> topRepos = List.of();
        if (c.getLatestFactId() != null) {
            CandidateFacts facts = candidateFactsRepository.findById(c.getLatestFactId())
                    .orElse(null);
            if (facts != null) {
                try {
                    Map<String,Object> factsMap = mapper.readValue(
                            facts.getFactsJson(),
                            new TypeReference<Map<String,Object>>() {}
                    );
                    Map<String,Object> github =
                            (Map<String,Object>) factsMap.getOrDefault("github", Map.of());
                    topRepos =
                            (List<Map<String, Object>>) github.getOrDefault("top_repos", List.of());
                } catch (Exception e) {
                    log.warn("Failed to parse facts JSON in analysis endpoint", e);
                }
            }
        }

        return CandidateAnalysisDTO.builder()
                .label(label)
                .score(score)
                .redFlags(redFlags)
                .yellowFlags(yellowFlags)
                .explanation(explanation)
                .recommendation(recommendation)
                .languageAlignment(languageAlignment)
                .suggestedQuestions(suggestedQuestions)
                .consolidatedReasons(consolidatedReasons)
                .projectVerification(projectVerification)
                .topRepos(topRepos)
                .build();
    }

    // ---------------------------------------------------------------------
    // Delete owned candidate
    // ---------------------------------------------------------------------
    @Transactional
    public void deleteCandidate(UUID id) {
        HrUser hr = currentHr();

        Candidate candidate = candidateRepository.findByIdAndHrUser(id, hr)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        // delete related facts and council results
        candidateFactsRepository.deleteAllByCandidateId(candidate.getId());
        councilResultRepository.deleteAllByCandidateId(candidate.getId());

        // delete stored files
        try {
            if (candidate.getCvPath() != null) {
                storageService.deleteCv(candidate.getCvPath());
            }
            if (candidate.getLinkedinPath() != null) {
                storageService.deleteLinkedin(candidate.getLinkedinPath());
            }
        } catch (Exception e) {
            log.warn("Failed to delete storage files for candidate {}", id, e);
        }

        candidateRepository.delete(candidate);
    }
    public List<CandidateDTO> listCandidatesForCurrentHr() {
        HrUser hr = currentHr();
        List<Candidate> candidates = candidateRepository.findByHrUser(hr);
        return candidates.stream()
                .map(c -> CandidateDTO.fromEntity(c, null, null))
                .toList();
    }

}
