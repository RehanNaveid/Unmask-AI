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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubService {

    @Value("${github.api-base-url:https://api.github.com}")
    private String githubApiBaseUrl;

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
                Map<String, Object> cachedMap =
                        objectMapper.readValue(cached, new TypeReference<Map<String, Object>>() {});
                log.info("Redis github top_repos for {}: {}", username, cachedMap.get("top_repos"));
                return cachedMap;
//                return objectMapper.readValue(cached, new TypeReference<>() {});
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
                List<Map<String, Object>> topRepos = buildTopRepos(repos);

                Map<String, Object> result = new HashMap<>();
                result.put("profile", profile);
                result.put("repositories", repos);
                result.put("events", events);
                result.put("repo_count", repoCount);
                result.put("language_histogram", languageHistogram);
                result.put("top_repos", topRepos);

                // redisClient.setex(redisKey, CACHE_TTL_SECONDS, objectMapper.writeValueAsString(result));

                // AFTER — respect remaining TTL
                long remainingSeconds = Instant.now().until(cache.getExpiresAt(), ChronoUnit.SECONDS);
                if (remainingSeconds > 60) {  // only cache if more than 1 minute remains
                    redisClient.setex(redisKey, (int) remainingSeconds, objectMapper.writeValueAsString(result));
                }
                log.info("DB github top_repos for {}: {}", username, topRepos);
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
        List<Map<String, Object>> topRepos = buildTopRepos(repos);

        Map<String, Object> combined = new HashMap<>();
        combined.put("profile", profile);
        combined.put("repositories", repos);
        combined.put("events", events);
        combined.put("repo_count", repoCount);
        combined.put("language_histogram", languageHistogram);
        combined.put("top_repos", topRepos);
        log.info("GH for {} -> repos={}, top_repos={}",
                username,
                repos == null ? 0 : repos.size(),
                combined.get("top_repos"));

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

    /**
     * Build top 4 repos for UI and council prompt.
     * Simple heuristic: most recently pushed, keep only key fields.
     */
    private List<Map<String, Object>> buildTopRepos(List<Map<String, Object>> repos) {
        if (repos == null || repos.isEmpty()) return List.of();

        return repos.stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(
                        (Map<String, Object> r) -> Objects.toString(r.get("pushed_at"), "")
                ).reversed())
                .limit(4)
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", r.get("name"));
                    m.put("full_name", r.get("full_name"));
                    m.put("html_url", r.get("html_url"));
                    m.put("description", r.get("description"));
                    m.put("language", r.get("language"));
                    m.put("pushed_at", r.get("pushed_at"));
                    return m;
                })
                .toList();
    }
}
