// src/main/java/com/example/Unmask/controller/AuthController.java
package com.example.Unmask.controller;

import com.example.Unmask.dto.AuthResponse;
import com.example.Unmask.dto.HrRegisterRequest;
import com.example.Unmask.dto.LoginRequest;
import com.example.Unmask.entity.HrUser;
import com.example.Unmask.repository.HrUserRepository;
import com.example.Unmask.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final HrUserRepository hrUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody HrRegisterRequest req) {
        if (hrUserRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        HrUser user = HrUser.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .company(req.getCompany())
                .position(req.getPosition())
                .role("ROLE_HR")
                .build();
        hrUserRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        AuthResponse resp = new AuthResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                List.of("ROLE_HR")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getEmail(), req.getPassword())
        );

        HrUser user = hrUserRepository.findByEmail(req.getEmail())
                .orElseThrow(); // should exist after successful auth

        String token = jwtService.generateToken(user.getEmail());
        AuthResponse resp = new AuthResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                List.of(user.getRole())
        );
        return ResponseEntity.ok(resp);
    }
}
