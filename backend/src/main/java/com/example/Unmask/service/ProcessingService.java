package com.example.Unmask.service;
import com.example.Unmask.dto.CvData;
import com.example.Unmask.entity.Candidate;
import com.example.Unmask.entity.CandidateFacts;
import com.example.Unmask.entity.CouncilResult;
import com.example.Unmask.repository.CandidateFactsRepository;
import com.example.Unmask.repository.CandidateRepository;
import com.example.Unmask.repository.CouncilResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessingService {

    private final CandidateRepository candidateRepository;
    private final CandidateFactsRepository candidateFactsRepository;
    private final CouncilResultRepository councilResultRepository;
    private final SupabaseStorageService storageService;
    private final GithubService githubService;
    private final VisionParsingService visionParsingService;
    private final FactSheetService factSheetService;
    private final CouncilService councilService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Async("candidateProcessorExecutor")
    public void processCandidateAsync(UUID candidateId) {
        log.info("Starting processing for candidate {}", candidateId);
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow();

        try {
            candidate.setStatus("PROCESSING");
            candidateRepository.save(candidate);

            Path tempDir = Files.createTempDirectory("candidate-" + candidateId);

            // 1) CV + LinkedIn parsing (Groq Vision)
            Path cvPath = tempDir.resolve("cv.pdf");
            try (InputStream cvIn = storageService.downloadCv(candidate.getCvPath())) {
                Files.copy(cvIn, cvPath);
            }
            CvData cvData = visionParsingService.parseCvPdf(cvPath, "cv-" + candidateId);

            CvData linkedinData = null;
            if (candidate.getLinkedinPath() != null) {
                Path liPath = tempDir.resolve("linkedin.pdf");
                try (InputStream liIn = storageService.downloadLinkedin(candidate.getLinkedinPath())) {
                    Files.copy(liIn, liPath);
                }
                linkedinData = visionParsingService.parseLinkedinPdf(liPath, "li-" + candidateId);
            }

            // 2) GitHub data
            Map<String,Object> githubJson = githubService.fetchGithubData(candidate.getGithubUsername());



            // 3) Fact sheet
            Map<String,Object> facts = factSheetService.buildFactSheet(candidate, cvData, linkedinData, githubJson);

            CandidateFacts cf = CandidateFacts.builder()
                    .candidate(candidate)
                    .version(1)
                    .status("READY")
                    .factsJson(mapper.writeValueAsString(facts))
                    .build();
            candidateFactsRepository.save(cf);
            candidate.setLatestFactId(cf.getId());

//            // 4) LLM Council — prepare payload according to FastAPI
//            Map<String,Object> councilPayload = new HashMap<>();
//            councilPayload.put("cv_json", facts.get("cv"));
//            councilPayload.put("linkedin_json", facts.get("linkedin"));
//            councilPayload.put("github_json", facts.get("github"));
//
//            Map<String,Object> councilResultJson = councilService.runCouncil(candidate.getId(), councilPayload);
            // 4) LLM Council — prepare payload according to FastAPI
            Map<String,Object> councilPayload = new HashMap<>();
            councilPayload.put("cv_json", facts.get("cv"));
            councilPayload.put("linkedin_json", facts.get("linkedin") != null ? facts.get("linkedin") : Map.of());
            councilPayload.put("github_json", facts.get("github") != null ? facts.get("github") : Map.of());

            Map<String,Object> councilResultJson = councilService.runCouncil(councilPayload);


            CouncilResult cr = CouncilResult.builder()
                    .candidate(candidate)
                    .version(1)
                    .status("READY")
                    .resultJson(mapper.writeValueAsString(councilResultJson))
                    .build();
            councilResultRepository.save(cr);
            candidate.setLatestCouncilResultId(cr.getId());

            candidate.setStatus("COMPLETED");
            candidateRepository.save(candidate);

            // cleanup
            try {
                Files.walk(tempDir)
                        .sorted(java.util.Comparator.reverseOrder())
                        .forEach(p -> {
                            try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                        });
            } catch (Exception ignored) {}

            log.info("Completed processing for candidate {}", candidateId);
        } catch (Exception e) {
            log.error("Processing failed for candidate {}", candidateId, e);
            candidate.setStatus("FAILED");
            candidateRepository.save(candidate);
        }

}
}
