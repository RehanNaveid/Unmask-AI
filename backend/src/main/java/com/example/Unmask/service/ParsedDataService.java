package com.example.Unmask.service;

import com.example.Unmask.entity.Candidate;
import com.example.Unmask.entity.CandidateFacts;
import com.example.Unmask.repository.CandidateFactsRepository;
import com.example.Unmask.repository.CandidateRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParsedDataService {

    private final CandidateRepository candidateRepository;
    private final CandidateFactsRepository factsRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    private Map<String, Object> loadFacts(UUID candidateId) {
        Candidate c = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        if (c.getLatestFactId() == null)
            throw new RuntimeException("Fact sheet not generated yet");

        CandidateFacts facts = factsRepository.findById(c.getLatestFactId())
                .orElseThrow(() -> new RuntimeException("Fact sheet missing in DB"));

        try {
            return mapper.readValue(
                    facts.getFactsJson(),
                    new TypeReference<Map<String, Object>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode fact sheet JSON");
        }
    }

    public Object getCv(UUID candidateId) {
        return loadFacts(candidateId).get("cv");
    }

    public Object getLinkedin(UUID candidateId) {
        return loadFacts(candidateId).get("linkedin");
    }

    public Object getGithub(UUID candidateId) {
        Map<String, Object> github = (Map<String, Object>) loadFacts(candidateId).get("github");

        // If you don't want to show full repo list:
        if (github.containsKey("repositories")) {
            github.remove("repositories");
        }

        return github;
    }
}
