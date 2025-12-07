package com.example.Unmask.repository;

import com.example.Unmask.entity.HrUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface HrUserRepository extends JpaRepository<HrUser, Long> {
    Optional<HrUser> findByEmail(String email);
}
