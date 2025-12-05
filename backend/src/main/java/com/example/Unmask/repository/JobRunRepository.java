package com.example.Unmask.repository;

import com.example.Unmask.entity.JobRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobRunRepository extends JpaRepository<JobRun, UUID> {
    List<JobRun> findByStatusAndRetryCountLessThan(String status, Integer maxRetries);
}

