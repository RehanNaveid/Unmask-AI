package com.example.Unmask.service;

import com.example.Unmask.dto.CvData;
import com.example.Unmask.entity.Candidate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FactSheetService {

    public Map<String,Object> buildFactSheet(
            Candidate candidate,
            CvData cv,
            CvData linkedin,
            Map<String,Object> githubJson
    ) {
        Map<String,Object> out = new HashMap<>();

        // 1) IDENTITY — strictly from CV
        Map<String,Object> identity = new HashMap<>();
        identity.put("name", (cv.getFirstName() + " " + cv.getLastName()).trim());
        identity.put("email", cv.getEmail());
        identity.put("github_username", candidate.getGithubUsername());
        identity.put("phone", cv.getPhone());
        identity.put("job_title", cv.getJobTitle());
        identity.put("location", cv.getAddress());
        out.put("identity", identity);

        // 2) RAW CV + LINKEDIN
        out.put("cv", cv != null ? cv : new CvData());
        out.put("linkedin", linkedin != null ? linkedin : new CvData());

        // 3) GITHUB SECTION (STRICT + ANALYSIS)
        Map<String,Object> gh = new HashMap<>();
        gh.put("profile", githubJson.getOrDefault("profile", Map.of()));
        gh.put("repositories", githubJson.getOrDefault("repositories", List.of()));
        gh.put("events", githubJson.getOrDefault("events", List.of()));
        gh.put("repo_count", githubJson.getOrDefault("repo_count", 0));
        gh.put("language_histogram", githubJson.getOrDefault("language_histogram", Map.of()));
        out.put("github", gh);

        // 4) META
        Map<String,Object> meta = new HashMap<>();
        meta.put("cv_source", "pdf+groq-vision");
        meta.put("linkedin_source", linkedin == null ? "none" : "pdf+groq-vision");
        meta.put("github_source", "github-rest+cache");
        meta.put("generated_at", Instant.now().toString());
        out.put("meta", meta);

        return out;
    }
}
