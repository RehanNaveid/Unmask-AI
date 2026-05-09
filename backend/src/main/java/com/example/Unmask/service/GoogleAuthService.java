package com.example.Unmask.service;

import com.example.Unmask.dto.AuthResponse;
import com.example.Unmask.entity.HrUser;
import com.example.Unmask.repository.HrUserRepository;
import com.example.Unmask.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;

@Service
public class GoogleAuthService {

    private static final Set<String> TRUSTED_ISSUERS = Set.of(
            "accounts.google.com",
            "https://accounts.google.com");

    private final HrUserRepository hrUserRepository;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier verifier;
    private final String clientId;

    public GoogleAuthService(
            HrUserRepository hrUserRepository,
            JwtService jwtService,
            @Value("${app.google.client-id}") String clientId) {
        this.hrUserRepository = hrUserRepository;
        this.jwtService = jwtService;
        this.clientId = clientId;
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public AuthResponse authenticateGoogleUser(String rawIdToken) {
        GoogleIdToken idToken = verifyToken(rawIdToken);
        GoogleIdToken.Payload payload = idToken.getPayload();

        validateAudience(payload.get("aud"));
        validateIssuer(payload.get("iss"));

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Google email address has not been verified");
        }

        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token did not include an email");
        }

        String name = (String) payload.get("name");
        if (name == null || name.isBlank()) {
            name = email;
        }

        final String displayName = name;
        HrUser user = hrUserRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(email, displayName));

        String token = jwtService.generateToken(user.getEmail());
        return AuthResponse.from(token, user);
    }

    private GoogleIdToken verifyToken(String rawIdToken) {
        if (rawIdToken == null || rawIdToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "idToken must not be blank");
        }

        try {
            GoogleIdToken idToken = verifier.verify(rawIdToken);
            if (idToken == null) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Google token verification failed: invalid or expired token");
            }
            return idToken;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Google token verification failed");
        }
    }

    private void validateAudience(Object audience) {
        boolean expectedAudience = clientId.equals(audience)
                || audience instanceof Collection<?> audiences && audiences.contains(clientId);

        if (!expectedAudience) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Google token audience does not match this application");
        }
    }

    private void validateIssuer(Object issuer) {
        if (!(issuer instanceof String issuerValue) || !TRUSTED_ISSUERS.contains(issuerValue)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Google token issuer is not trusted");
        }
    }

    private HrUser createGoogleUser(String email, String fullName) {
        HrUser newUser = HrUser.builder()
                .email(email)
                .password(null)
                .fullName(fullName)
                .company("")
                .position("")
                .role("ROLE_HR")
                .provider("GOOGLE")
                .onboardingCompleted(false)
                .build();
        return hrUserRepository.save(newUser);
    }
}
