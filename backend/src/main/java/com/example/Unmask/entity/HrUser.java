package com.example.Unmask.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hr_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email; // used as username for login

    @Column(nullable = true)
    private String password; // BCrypt-hashed; null for Google OAuth users

    @Column(nullable = false)
    private String fullName;

    private String company;
    private String position;

    @Column(nullable = false)
    private String role; // always "ROLE_HR"

    @Builder.Default
    @Column(nullable = false, columnDefinition = "varchar(20) default 'LOCAL'")
    private String provider = "LOCAL";

    @Builder.Default
    @Column(name = "onboarding_completed", nullable = false, columnDefinition = "boolean default false")
    private boolean onboardingCompleted = false;
}
