package com.example.Unmask.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "github_cache")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GithubCache {

    @Id
    @Column(name = "github_username")
    private String githubUsername;

//    @Type(JsonType.class)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "profile_json", columnDefinition = "jsonb", nullable = false)
    private String profileJson;

//    @Type(JsonType.class)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "repos_json", columnDefinition = "jsonb", nullable = false)
    private String reposJson;

//    @Type(JsonType.class)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "events_json", columnDefinition = "jsonb", nullable = false)
    private String eventsJson;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
