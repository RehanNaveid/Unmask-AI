package com.example.Unmask.repository;

import com.example.Unmask.entity.GithubCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GithubCacheRepository extends JpaRepository<GithubCache, String> {}

