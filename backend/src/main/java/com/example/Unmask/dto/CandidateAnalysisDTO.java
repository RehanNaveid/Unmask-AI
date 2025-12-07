package com.example.Unmask.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateAnalysisDTO {
    private String label;
    private double score;
    private List<String> redFlags;
    private List<String> yellowFlags;
    private String explanation;
    private String recommendation;
    private Map<String,Object> languageAlignment;
    private List<String> suggestedQuestions;
    private List<String> consolidatedReasons;
    private List<Map<String,Object>> projectVerification;

    // optional: top 4 repos from facts.github.top_repos
    private List<Map<String,Object>> topRepos;
}
