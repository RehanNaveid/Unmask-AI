package com.example.Unmask.service;
import com.example.Unmask.dto.CvData;
import com.example.Unmask.entity.Candidate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class FactSheetService {

    @SuppressWarnings("unchecked")
    public Map<String,Object> buildFactSheet(
            Candidate candidate,
            CvData cvData,
            CvData linkedinData,
            Map<String,Object> githubJson
    ) {
        Map<String,Object> facts = new HashMap<>();

        // identity
        Map<String,Object> identity = new HashMap<>();
        identity.put("name", ((cvData.getFirstName() + " " + cvData.getLastName()).trim()));
        identity.put("email", cvData.getEmail());
        identity.put("github_username", candidate.getGithubUsername());
        identity.put("role", cvData.getJobTitle());
        facts.put("identity", identity);

        // cv / linkedin
        facts.put("cv", cvData);
        facts.put("linkedin", linkedinData);

        // github
        Map<String,Object> gh = new HashMap<>();
        gh.put("profile", githubJson.get("profile"));
        gh.put("repositories", githubJson.get("repositories"));
        gh.put("events", githubJson.get("events"));
        facts.put("github", gh);

        // meta
        Map<String,Object> meta = new HashMap<>();
        meta.put("cv_source", "pdf+groq-vision");
        meta.put("linkedin_source", "pdf+groq-vision");
        meta.put("github_source", "github-rest+cache");
        meta.put("generated_at", Instant.now().toString());
        facts.put("meta", meta);

        return facts;
    }
}
