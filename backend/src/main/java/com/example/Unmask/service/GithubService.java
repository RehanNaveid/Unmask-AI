package com.example.Unmask.service;

import com.example.Unmask.entity.GithubCache;
import com.example.Unmask.repository.GithubCacheRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubService {

    @Value("${github.api-base-url:https://api.github.com}")
    private String githubApiBaseUrl;

    /**
     * No token used: rely on unauthenticated rate limit (60 req/hour/IP).
     * Keep this property only if you later want to switch to token.
     */
    @Value("${github.token:}")
    private String githubToken;

    private final GithubCacheRepository githubCacheRepository;
    private final UpstashRedisClient redisClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    private static final int CACHE_TTL_SECONDS = 24 * 3600;

    public Map<String, Object> fetchGithubData(String username) {
        String redisKey = "github:" + username;

        // 1) Redis cache
        try {
            String cached = redisClient.get(redisKey);
            if (cached != null) {
                return objectMapper.readValue(cached, new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("Redis cache read failed", e);
        }

        // 2) DB cache
        GithubCache cache = githubCacheRepository.findById(username).orElse(null);
        if (cache != null && cache.getExpiresAt().isAfter(Instant.now())) {
            try {
                Map<String, Object> profile =
                        objectMapper.readValue(cache.getProfileJson(), new TypeReference<>() {});
                List<Map<String, Object>> repos =
                        objectMapper.readValue(cache.getReposJson(), new TypeReference<>() {});
                List<Map<String, Object>> events =
                        objectMapper.readValue(cache.getEventsJson(), new TypeReference<>() {});

                Map<String, Integer> languageHistogram = buildLanguageHistogram(repos);
                int repoCount = repos != null ? repos.size() : 0;

                Map<String, Object> result = new HashMap<>();
                result.put("profile", profile);
                result.put("repositories", repos);
                result.put("events", events);
                result.put("repo_count", repoCount);
                result.put("language_histogram", languageHistogram);

                redisClient.setex(redisKey, CACHE_TTL_SECONDS, objectMapper.writeValueAsString(result));
                return result;
            } catch (Exception e) {
                log.warn("DB cache deserialization failed", e);
            }
        }

        // 3) GitHub API (unauthenticated)
        Map<String, Object> profile = getJson("/users/" + username);
        List<Map<String, Object>> repos = getList("/users/" + username + "/repos");
        List<Map<String, Object>> events = getList("/users/" + username + "/events");

        Map<String, Integer> languageHistogram = buildLanguageHistogram(repos);
        int repoCount = repos != null ? repos.size() : 0;

        Map<String, Object> combined = new HashMap<>();
        combined.put("profile", profile);
        combined.put("repositories", repos);
        combined.put("events", events);
        combined.put("repo_count", repoCount);
        combined.put("language_histogram", languageHistogram);

        // Persist cache
        try {
            GithubCache newCache = GithubCache.builder()
                    .githubUsername(username)
                    .profileJson(objectMapper.writeValueAsString(profile))
                    .reposJson(objectMapper.writeValueAsString(repos))
                    .eventsJson(objectMapper.writeValueAsString(events))
                    .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                    .build();
            githubCacheRepository.save(newCache);

            redisClient.setex(redisKey, CACHE_TTL_SECONDS, objectMapper.writeValueAsString(combined));
        } catch (Exception e) {
            log.warn("Failed to persist GitHub cache", e);
        }

        return combined;
    }

    private Map<String, Object> getJson(String path) {
        HttpEntity<Void> entity = new HttpEntity<>(githubHeaders());
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    githubApiBaseUrl + path, HttpMethod.GET, entity, Map.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("GitHub API error: " + resp.getStatusCode());
            }
            return resp.getBody();
        } catch (HttpStatusCodeException ex) {
            // Handle rate limit or 404 gracefully
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN
                    || ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                log.error("GitHub rate limit reached (no token): {}", ex.getResponseBodyAsString());
                throw new RuntimeException("GitHub rate limit reached (unauthenticated)");
            }
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.warn("GitHub user not found: {}", path);
                return Map.of();
            }
            throw ex;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getList(String path) {
        HttpEntity<Void> entity = new HttpEntity<>(githubHeaders());
        try {
            ResponseEntity<List> resp = restTemplate.exchange(
                    githubApiBaseUrl + path, HttpMethod.GET, entity, List.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("GitHub API error: " + resp.getStatusCode());
            }
            return resp.getBody();
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN
                    || ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                log.error("GitHub rate limit reached (no token): {}", ex.getResponseBodyAsString());
                throw new RuntimeException("GitHub rate limit reached (unauthenticated)");
            }
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.warn("GitHub list resource not found: {}", path);
                return List.of();
            }
            throw ex;
        }
    }

    private HttpHeaders githubHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/vnd.github+json");
        headers.set("User-Agent", "unmasker-backend");
        // If you later add a token, enable:
        // if (githubToken != null && !githubToken.isBlank()) {
        //     headers.setBearerAuth(githubToken);
        // }
        return headers;
    }

    private Map<String, Integer> buildLanguageHistogram(List<Map<String, Object>> repos) {
        Map<String, Integer> histogram = new HashMap<>();
        if (repos == null) return histogram;

        for (Map<String, Object> repo : repos) {
            Object lang = repo.get("language");
            if (lang != null) {
                histogram.merge(lang.toString(), 1, Integer::sum);
            }
        }
        return histogram;
    }
}
