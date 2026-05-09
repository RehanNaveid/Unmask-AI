// src/main/java/com/example/Unmask/controller/AuthController.java
package com.example.Unmask.controller;

import com.example.Unmask.dto.AuthResponse;
import com.example.Unmask.dto.CompleteProfileRequest;
import com.example.Unmask.dto.GoogleAuthRequest;
import com.example.Unmask.dto.HrRegisterRequest;
import com.example.Unmask.dto.LoginRequest;
import com.example.Unmask.entity.HrUser;
import com.example.Unmask.repository.HrUserRepository;
import com.example.Unmask.security.JwtService;
import com.example.Unmask.service.GoogleAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final HrUserRepository hrUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody HrRegisterRequest req) {
        if (hrUserRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        HrUser user = HrUser.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .company(req.getCompany())
                .position(req.getPosition())
                .role("ROLE_HR")
                .provider("LOCAL")
                .onboardingCompleted(true)
                .build();
        hrUserRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(token, user));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        HrUser existingUser = hrUserRepository.findByEmail(req.getEmail()).orElse(null);
        if (existingUser != null && isGoogleProvider(existingUser)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "This account uses Google sign-in. Please continue with Google.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getEmail(), req.getPassword()));

        HrUser user = hrUserRepository.findByEmail(req.getEmail())
                .orElseThrow(); // should exist after successful auth

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(AuthResponse.from(token, user));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleAuthRequest req) {
        AuthResponse resp = googleAuthService.authenticateGoogleUser(req.getIdToken());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/complete-profile")
    public ResponseEntity<AuthResponse> completeProfile(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody CompleteProfileRequest req) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        String company = normalizeRequired(req.getCompany(), "Company");
        String position = normalizeRequired(req.getPosition(), "Position");

        HrUser user = hrUserRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));

        user.setCompany(company);
        user.setPosition(position);
        user.setOnboardingCompleted(true);
        hrUserRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(AuthResponse.from(token, user));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() == null ? ex.getStatusCode().toString() : ex.getReason();
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
    }

    private boolean isGoogleProvider(HrUser user) {
        return "GOOGLE".equalsIgnoreCase(user.getProvider());
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        return normalized;
    }
}
