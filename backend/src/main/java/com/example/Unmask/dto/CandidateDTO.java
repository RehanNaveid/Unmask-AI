package com.example.Unmask.dto;
import com.example.Unmask.entity.Candidate;
import lombok.*;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateDTO {

    private UUID id;
    private String name;
    private String email;
    private String githubUsername;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    private Map<String,Object> facts;
    private Map<String,Object> councilResult;

    public static CandidateDTO fromEntity(Candidate c,
                                          Map<String,Object> facts,
                                          Map<String,Object> councilResult) {
        return CandidateDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .githubUsername(c.getGithubUsername())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .facts(facts)
                .councilResult(councilResult)
                .build();
    }
}

