package com.example.Unmask.repository;
import com.example.Unmask.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    Optional<Candidate> findByGithubUsername(String githubUsername);
}
