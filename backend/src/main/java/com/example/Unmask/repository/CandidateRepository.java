package com.example.Unmask.repository;

import com.example.Unmask.entity.Candidate;
import com.example.Unmask.entity.HrUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.w3c.dom.stylesheets.LinkStyle;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    Optional<Candidate> findByGithubUsername(String githubUsername);

//    void deleteAllByCandidateId(UUID candidateId);

    // for HR‑scoped access
    Optional<Candidate> findByIdAndHrUser(UUID id, HrUser hrUser);
    List<Candidate> findByHrUser(HrUser hrUser);

}
