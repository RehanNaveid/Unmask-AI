package com.example.Unmask.repository;

import com.example.Unmask.entity.Candidate;
import com.example.Unmask.entity.CouncilResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouncilResultRepository extends JpaRepository<CouncilResult, UUID> {
    Optional<CouncilResult> findTopByCandidateIdOrderByVersionDesc(UUID candidateId);
    void deleteAllByCandidateId(UUID candidateId);
}
