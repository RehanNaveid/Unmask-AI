package com.example.Unmask.repository;
import com.example.Unmask.entity.CandidateFacts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateFactsRepository extends JpaRepository<CandidateFacts, UUID> {
    Optional<CandidateFacts> findTopByCandidateIdOrderByVersionDesc(UUID candidateId);
    void deleteAllByCandidateId(UUID candidateId);
}