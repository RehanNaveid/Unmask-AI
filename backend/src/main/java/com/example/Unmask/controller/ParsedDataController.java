package com.example.Unmask.controller;

import com.example.Unmask.service.ParsedDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/parsed")
@RequiredArgsConstructor
public class ParsedDataController {

    private final ParsedDataService parsedDataService;

    // 1️⃣ CV Only
    @GetMapping("/{id}/cv")
    public ResponseEntity<?> getCv(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("cv", parsedDataService.getCv(id)));
    }

    // 2️⃣ LinkedIn Only
    @GetMapping("/{id}/linkedin")
    public ResponseEntity<?> getLinkedin(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("linkedin", parsedDataService.getLinkedin(id)));
    }

    // 3️⃣ GitHub Only (No repos)
    @GetMapping("/{id}/github")
    public ResponseEntity<?> getGithub(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("github", parsedDataService.getGithub(id)));
    }
}
