package com.example.Unmask.dto;

import com.example.Unmask.entity.HrUser;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private List<String> roles;
    private String provider;
    private boolean onboardingCompleted;
    private String company;
    private String position;

    public static AuthResponse from(String token, HrUser user) {
        String provider = user.getProvider() == null ? "LOCAL" : user.getProvider();

        return new AuthResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                List.of(user.getRole()),
                provider,
                user.isOnboardingCompleted(),
                user.getCompany(),
                user.getPosition());
    }
}
