package com.example.Unmask.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupabaseStorageService {

    @Value("${app.supabase.url}")
    private String supabaseUrl;

    @Value("${app.supabase.service-key}")
    private String serviceKey;

    @Value("${app.supabase.storage-bucket-cv}")
    private String cvBucket;

    @Value("${app.supabase.storage-bucket-linkedin}")
    private String linkedinBucket;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadCv(UUID candidateId, MultipartFile file) {
        String path = candidateId + "/cv.pdf";
        uploadFile(cvBucket, path, file);
        return path;
    }

    public String uploadLinkedin(UUID candidateId, MultipartFile file) {
        String path = candidateId + "/linkedin.pdf";
        uploadFile(linkedinBucket, path, file);
        return path;
    }

    public InputStream downloadCv(String path) {
        return downloadFile(cvBucket, path);
    }

    public InputStream downloadLinkedin(String path) {
        return downloadFile(linkedinBucket, path);
    }

    // NEW: delete methods used by CandidateService
    public void deleteCv(String path) {
        deleteFile(cvBucket, path);
    }

    public void deleteLinkedin(String path) {
        deleteFile(linkedinBucket, path);
    }

    // ---------------------------------------------------------------------

    private void uploadFile(String bucket, String path, MultipartFile file) {
        String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(serviceKey);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        try {
            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
            ResponseEntity<String> resp =
                    restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Supabase upload failed: " + resp.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Supabase upload error", e);
            throw new RuntimeException("Supabase upload error: " + e.getMessage());
        }
    }

    private InputStream downloadFile(String bucket, String path) {
        String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(serviceKey);

        try {
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> resp =
                    restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new RuntimeException("Supabase download failed: " + resp.getStatusCode());
            }
            return new ByteArrayInputStream(resp.getBody());
        } catch (Exception e) {
            log.error("Supabase download error", e);
            throw new RuntimeException("Supabase download error: " + e.getMessage());
        }
    }

    private void deleteFile(String bucket, String path) {
        String url = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(serviceKey);

        try {
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> resp =
                    restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                log.warn("Supabase delete failed for {}/{}: {}", bucket, path, resp.getStatusCode());
            }
        } catch (Exception e) {
            log.warn("Supabase delete error for {}/{}", bucket, path, e);
        }
    }
}
