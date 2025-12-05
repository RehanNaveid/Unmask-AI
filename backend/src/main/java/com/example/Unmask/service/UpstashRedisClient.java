package com.example.Unmask.service;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class UpstashRedisClient {

    @Value("${upstash.url}")
    private String upstashUrl;

    @Value("${upstash.token}")
    private String upstashToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public String get(String key) {
        String url = upstashUrl + "/get/" + key;
        HttpHeaders headers = baseHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<UpstashResponse> resp =
                    restTemplate.exchange(url, HttpMethod.GET, entity, UpstashResponse.class);
            return resp.getBody() != null ? resp.getBody().getResult() : null;
        } catch (Exception e) {
            log.warn("Upstash GET failed for key {}", key, e);
            return null;
        }
    }

    public void setex(String key, int ttlSeconds, String value) {
        String url = upstashUrl + "/setex/" + key + "/" + ttlSeconds;
        HttpHeaders headers = baseHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        HttpEntity<String> entity = new HttpEntity<>(value, headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            log.warn("Upstash SETEX failed for key {}", key, e);
        }
    }

    private HttpHeaders baseHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(upstashToken);
        return headers;
    }

    @Data
    public static class UpstashResponse {
        private String result;
        private String error;
    }
}

