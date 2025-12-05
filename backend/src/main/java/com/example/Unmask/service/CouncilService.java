package com.example.Unmask.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouncilService {

    @Value("${llm-council.url}")
    private String councilUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    // payload must already have keys: cv_json, linkedin_json, github_json
    public Map<String,Object> runCouncil(Map<String,Object> payload) {
        String url = councilUrl + "/api/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            String body = mapper.writeValueAsString(payload);
            log.info("Sending to council-service: {}", body);

            ResponseEntity<String> resp = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                log.error("Council API error {} body={}", resp.getStatusCode(), resp.getBody());
                throw new RuntimeException("Council API error: " + resp.getStatusCode());
            }

            // Your FastAPI /api/analyze returns already the final result JSON
            return mapper.readValue(resp.getBody(), new TypeReference<Map<String,Object>>() {});
        } catch (Exception e) {
            log.error("LLM Council call failed", e);
            throw new RuntimeException("LLM Council call failed: " + e.getMessage(), e);
        }
    }
}
