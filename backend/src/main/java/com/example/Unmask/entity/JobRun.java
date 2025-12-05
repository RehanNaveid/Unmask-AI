package com.example.Unmask.entity;
//import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "job_runs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRun {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "candidate_id")
    private UUID candidateId;

    @Column(name = "job_type", nullable = false)
    private String jobType; // FULL_PIPELINE, PARSE_CV, etc.

    @Column(name = "status", nullable = false)
    private String status; // PENDING, RUNNING, COMPLETED, FAILED

//    @Type(JsonType.class)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb")
    private String payload;

    private String error;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "retry_count")
    private Integer retryCount;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
        if (retryCount == null) retryCount = 0;
    }
}
