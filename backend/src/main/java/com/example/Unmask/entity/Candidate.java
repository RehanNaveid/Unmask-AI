package com.example.Unmask.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "candidates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;
    private String email;

    @Column(name = "github_username", nullable = false)
    private String githubUsername;

    @Column(name = "cv_path")
    private String cvPath;

    @Column(name = "linkedin_path")
    private String linkedinPath;

    private String status; // CREATED, UPLOADED, PROCESSING, COMPLETED, FAILED

    @Column(name = "latest_fact_id")
    private UUID latestFactId;

    @Column(name = "latest_council_result_id")
    private UUID latestCouncilResultId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hr_user_id")
    private HrUser hrUser;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) this.status = "CREATED";
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
