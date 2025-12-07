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
    private String email;        // used as username for login

    @Column(nullable = false)
    private String password;     // BCrypt-hashed

    @Column(nullable = false)
    private String fullName;

    private String company;
    private String position;

    @Column(nullable = false)
    private String role;         // always "ROLE_HR"
}
