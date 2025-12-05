package com.example.Unmask.service;
import com.example.Unmask.dto.CvData;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import jakarta.annotation.PostConstruct;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisionParsingService {

    @Value("${groq.api-key}")
    private String groqApiKey;

    private final PdfImageService pdfImageService;
    private final ObjectMapper mapper = new ObjectMapper();

    private Map<String,Object> cvSchema;

    @PostConstruct
    public void init() {
        cvSchema = buildCvDataSchema();
    }

    public CvData parseCvPdf(Path pdfPath, String tempDirSuffix) {
        Path outDir = pdfPath.getParent().resolve("cv_images_" + tempDirSuffix);
        List<Path> images = pdfImageService.convertPdfToImages(pdfPath, outDir);

        List<CvData> pageData = new ArrayList<>();
        for (Path img : images) {
            try {
                String base64 = encodeImage(img);
                Map<String,Object> raw = callGroqVision(base64, "cv");
                CvData cleaned = cleanAndFixCvData(raw);
                pageData.add(cleaned);
            } catch (Exception e) {
                log.warn("Failed to parse CV page {}: {}", img, e.getMessage());
            }
        }
        cleanupTempDir(outDir);
        return mergeCvData(pageData);
    }

    public CvData parseLinkedinPdf(Path pdfPath, String tempDirSuffix) {
        Path outDir = pdfPath.getParent().resolve("linkedin_images_" + tempDirSuffix);
        List<Path> images = pdfImageService.convertPdfToImages(pdfPath, outDir);

        List<CvData> pageData = new ArrayList<>();
        for (Path img : images) {
            try {
                String base64 = encodeImage(img);
                Map<String,Object> raw = callGroqVision(base64, "linkedin");
                CvData cleaned = cleanAndFixCvData(raw);
                pageData.add(cleaned);
            } catch (Exception e) {
                log.warn("Failed to parse LinkedIn page {}: {}", img, e.getMessage());
            }
        }
        cleanupTempDir(outDir);
        return mergeCvData(pageData);
    }

    private String encodeImage(Path imagePath) throws Exception {
        byte[] bytes = Files.readAllBytes(imagePath);
        return Base64.getEncoder().encodeToString(bytes);
    }

    private void cleanupTempDir(Path dir) {
        try {
            if (Files.exists(dir)) {
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try {
                                Files.deleteIfExists(p);
                            } catch (Exception ignored) {}
                        });
            }
        } catch (Exception e) {
            log.warn("Failed to cleanup temp dir {}", dir);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String,Object> callGroqVision(String base64Image, String documentType) throws Exception {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        String systemPrompt = """
You are a CV/Resume parser. Extract information from the CV image and return it as valid JSON matching the provided JSON schema.
Guidelines:
- Extract years and months as integers.
- For ongoing positions: "ongoing": true, omit endYear/endMonth.
- Do not include any text outside the JSON object.
""";

        String userPrompt = "Extract CV information from this image and return JSON with this schema: "
                + mapper.writerWithDefaultPrettyPrinter().writeValueAsString(cvSchema);

        List<Map<String,Object>> messageContent = List.of(
                Map.of("type", "text", "text", userPrompt),
                Map.of("type", "image_url",
                        "image_url", Map.of("url", "data:image/png;base64," + base64Image))
        );

        Map<String,Object> body = new HashMap<>();
        body.put("model", "meta-llama/llama-4-maverick-17b-128e-instruct");
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", messageContent)
        ));
        body.put("response_format", Map.of("type", "json_object"));
        body.put("temperature", 0.2);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);

        ResponseEntity<String> resp = new RestTemplate()
                .exchange(url, HttpMethod.POST, entity, String.class);

        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
            throw new RuntimeException("Groq Vision error: " + resp.getStatusCode());
        }

        Map<String,Object> completion = mapper.readValue(resp.getBody(), new TypeReference<>() {});
        List<Map<String,Object>> choices = (List<Map<String,Object>>) completion.get("choices");
        if (choices == null || choices.isEmpty()) {
            return Map.of();
        }

        Map<String,Object> message = (Map<String,Object>) choices.get(0).get("message");
        Object contentObj = message.get("content");
        if (contentObj instanceof String s) {
            try {
                return mapper.readValue(s, new TypeReference<>() {});
            } catch (Exception e) {
                // try to extract JSON substring
                String json = extractJson(s);
                return json != null ? mapper.readValue(json, new TypeReference<>() {}) : Map.of();
            }
        } else {
            return Map.of();
        }
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private CvData cleanAndFixCvData(Map<String,Object> rawData) {
        if (rawData == null || rawData.isEmpty()) {
            return emptyCvData();
        }

        // normalize Hobbies -> hobbies, etc.
        if (rawData.containsKey("Hobbies") && !rawData.containsKey("hobbies")) {
            rawData.put("hobbies", rawData.get("Hobbies"));
        }

        // fix numeric fields that may be strings
        List<String> numberFields = List.of(
                "startYear","endYear","startMonth","endMonth","issuedYear","issuedMonth"
        );

        java.util.function.Consumer<Map<String,Object>> fixNumberFields = obj -> {
            for (String f : numberFields) {
                Object v = obj.get(f);
                if (v == null) continue;
                if (v instanceof Number) continue;
                if (v instanceof String s) {
                    if (s.isBlank()) {
                        obj.remove(f);
                    } else {
                        try {
                            obj.put(f, Integer.parseInt(s.trim()));
                        } catch (NumberFormatException ex) {
                            obj.remove(f);
                        }
                    }
                }
            }
        };

        List<Map<String,Object>> prof = (List<Map<String,Object>>) rawData.getOrDefault("professionalExperiences", List.of());
        prof.forEach(fixNumberFields);
        List<Map<String,Object>> otherExp = (List<Map<String,Object>>) rawData.getOrDefault("otherExperiences", List.of());
        otherExp.forEach(fixNumberFields);
        List<Map<String,Object>> educations = (List<Map<String,Object>>) rawData.getOrDefault("educations", List.of());
        educations.forEach(fixNumberFields);
        List<Map<String,Object>> certs = (List<Map<String,Object>>) rawData.getOrDefault("certifications", List.of());
        certs.forEach(fixNumberFields);

        // Map into CvData
        CvData.CvDataBuilder b = CvData.builder()
                .lastName((String) rawData.getOrDefault("lastName",""))
                .firstName((String) rawData.getOrDefault("firstName",""))
                .address((String) rawData.getOrDefault("address",""))
                .email((String) rawData.getOrDefault("email",""))
                .phone((String) rawData.getOrDefault("phone",""))
                .linkedin((String) rawData.getOrDefault("linkedin",""))
                .github((String) rawData.getOrDefault("github",""))
                .personalWebsite((String) rawData.getOrDefault("personalWebsite",""))
                .professionalSummary((String) rawData.getOrDefault("professionalSummary",""))
                .jobTitle((String) rawData.getOrDefault("jobTitle",""))
                .skills((List<String>) rawData.getOrDefault("skills", List.of()))
                .publications((List<String>) rawData.getOrDefault("publications", List.of()))
                .distinctions((List<String>) rawData.getOrDefault("distinctions", List.of()))
                .hobbies((List<String>) rawData.getOrDefault("hobbies", List.of()))
                .references((List<String>) rawData.getOrDefault("references", List.of()))
                .other((Map<String,Object>) rawData.getOrDefault("other", Map.of()));

        // experiences
        List<CvData.Experience> profExps = new ArrayList<>();
        for (Map<String,Object> e : prof) {
            profExps.add(CvData.Experience.builder()
                    .companyName((String) e.getOrDefault("companyName",""))
                    .title((String) e.getOrDefault("title",""))
                    .location((String) e.getOrDefault("location",""))
                    .type((String) e.getOrDefault("type",""))
                    .startYear((Integer) e.get("startYear"))
                    .startMonth((Integer) e.get("startMonth"))
                    .endYear((Integer) e.get("endYear"))
                    .endMonth((Integer) e.get("endMonth"))
                    .ongoing((Boolean) e.getOrDefault("ongoing", Boolean.FALSE))
                    .description((String) e.getOrDefault("description",""))
                    .associatedSkills((List<String>) e.getOrDefault("associatedSkills", List.of()))
                    .build());
        }
        b.professionalExperiences(profExps);

        List<CvData.Experience> otherExps = new ArrayList<>();
        for (Map<String,Object> e : otherExp) {
            otherExps.add(CvData.Experience.builder()
                    .companyName((String) e.getOrDefault("companyName",""))
                    .title((String) e.getOrDefault("title",""))
                    .location((String) e.getOrDefault("location",""))
                    .type((String) e.getOrDefault("type",""))
                    .startYear((Integer) e.get("startYear"))
                    .startMonth((Integer) e.get("startMonth"))
                    .endYear((Integer) e.get("endYear"))
                    .endMonth((Integer) e.get("endMonth"))
                    .ongoing((Boolean) e.getOrDefault("ongoing", Boolean.FALSE))
                    .description((String) e.getOrDefault("description",""))
                    .associatedSkills((List<String>) e.getOrDefault("associatedSkills", List.of()))
                    .build());
        }
        b.otherExperiences(otherExps);

        List<CvData.Education> eduList = new ArrayList<>();
        for (Map<String,Object> e : educations) {
            eduList.add(CvData.Education.builder()
                    .degree((String) e.getOrDefault("degree",""))
                    .institution((String) e.getOrDefault("institution",""))
                    .location((String) e.getOrDefault("location",""))
                    .startYear((Integer) e.get("startYear"))
                    .startMonth((Integer) e.get("startMonth"))
                    .endYear((Integer) e.get("endYear"))
                    .endMonth((Integer) e.get("endMonth"))
                    .ongoing((Boolean) e.getOrDefault("ongoing", Boolean.FALSE))
                    .description((String) e.getOrDefault("description",""))
                    .associatedSkills((List<String>) e.getOrDefault("associatedSkills", List.of()))
                    .build());
        }
        b.educations(eduList);

        List<Map<String,Object>> langsRaw = (List<Map<String,Object>>) rawData.getOrDefault("languages", List.of());
        List<CvData.Language> langs = new ArrayList<>();
        for (Map<String,Object> l : langsRaw) {
            langs.add(CvData.Language.builder()
                    .language((String) l.getOrDefault("language",""))
                    .level((String) l.getOrDefault("level",""))
                    .build());
        }
        b.languages(langs);

        List<CvData.Certification> certList = new ArrayList<>();
        for (Map<String,Object> c : certs) {
            certList.add(CvData.Certification.builder()
                    .title((String) c.getOrDefault("title",""))
                    .issuer((String) c.getOrDefault("issuer",""))
                    .issuedYear((Integer) c.get("issuedYear"))
                    .issuedMonth((Integer) c.get("issuedMonth"))
                    .build());
        }
        b.certifications(certList);

        return b.build();
    }

    private CvData mergeCvData(List<CvData> list) {
        if (list == null || list.isEmpty()) {
            return emptyCvData();
        }
        CvData merged = emptyCvData();

        for (CvData d : list) {
            if (d == null) continue;

            if (merged.getLastName().isEmpty() && d.getLastName() != null) merged.setLastName(d.getLastName());
            if (merged.getFirstName().isEmpty() && d.getFirstName() != null) merged.setFirstName(d.getFirstName());
            if (merged.getAddress().isEmpty() && d.getAddress() != null) merged.setAddress(d.getAddress());
            if (merged.getEmail().isEmpty() && d.getEmail() != null) merged.setEmail(d.getEmail());
            if (merged.getPhone().isEmpty() && d.getPhone() != null) merged.setPhone(d.getPhone());
            if (merged.getLinkedin().isEmpty() && d.getLinkedin() != null) merged.setLinkedin(d.getLinkedin());
            if (merged.getGithub().isEmpty() && d.getGithub() != null) merged.setGithub(d.getGithub());
            if (merged.getPersonalWebsite().isEmpty() && d.getPersonalWebsite() != null)
                merged.setPersonalWebsite(d.getPersonalWebsite());
            if (merged.getProfessionalSummary().isEmpty() && d.getProfessionalSummary() != null)
                merged.setProfessionalSummary(d.getProfessionalSummary());
            if (merged.getJobTitle().isEmpty() && d.getJobTitle() != null)
                merged.setJobTitle(d.getJobTitle());

            merged.getProfessionalExperiences().addAll(
                    Optional.ofNullable(d.getProfessionalExperiences()).orElse(List.of()));
            merged.getOtherExperiences().addAll(
                    Optional.ofNullable(d.getOtherExperiences()).orElse(List.of()));
            merged.getEducations().addAll(
                    Optional.ofNullable(d.getEducations()).orElse(List.of()));

            Set<String> skills = new LinkedHashSet<>(merged.getSkills());
            skills.addAll(Optional.ofNullable(d.getSkills()).orElse(List.of()));
            merged.setSkills(new ArrayList<>(skills));

            merged.getLanguages().addAll(Optional.ofNullable(d.getLanguages()).orElse(List.of()));

            merged.setPublications(mergeUnique(merged.getPublications(), d.getPublications()));
            merged.setDistinctions(mergeUnique(merged.getDistinctions(), d.getDistinctions()));
            merged.setHobbies(mergeUnique(merged.getHobbies(), d.getHobbies()));
            merged.setReferences(mergeUnique(merged.getReferences(), d.getReferences()));
            merged.getCertifications().addAll(Optional.ofNullable(d.getCertifications()).orElse(List.of()));

            if (d.getOther() != null) {
                Map<String,Object> other = new LinkedHashMap<>(merged.getOther());
                other.putAll(d.getOther());
                merged.setOther(other);
            }
        }

        return merged;
    }

    private List<String> mergeUnique(List<String> base, List<String> extra) {
        Set<String> set = new LinkedHashSet<>(Optional.ofNullable(base).orElse(List.of()));
        if (extra != null) set.addAll(extra);
        return new ArrayList<>(set);
    }

    private CvData emptyCvData() {
        return CvData.builder()
                .lastName("")
                .firstName("")
                .address("")
                .email("")
                .phone("")
                .linkedin("")
                .github("")
                .personalWebsite("")
                .professionalSummary("")
                .jobTitle("")
                .professionalExperiences(new ArrayList<>())
                .otherExperiences(new ArrayList<>())
                .educations(new ArrayList<>())
                .skills(new ArrayList<>())
                .languages(new ArrayList<>())
                .publications(new ArrayList<>())
                .distinctions(new ArrayList<>())
                .hobbies(new ArrayList<>())
                .references(new ArrayList<>())
                .certifications(new ArrayList<>())
                .other(new LinkedHashMap<>())
                .build();
    }

    private Map<String,Object> buildCvDataSchema() {
        // For brevity, this is a minimal but representative subset; you can expand to full schema.
        Map<String,Object> schema = new LinkedHashMap<>();
        schema.put("type","object");
        Map<String,Object> props = new LinkedHashMap<>();
        props.put("lastName", Map.of("type","string"));
        props.put("firstName", Map.of("type","string"));
        props.put("address", Map.of("type","string"));
        props.put("email", Map.of("type","string"));
        props.put("phone", Map.of("type","string"));
        props.put("linkedin", Map.of("type","string"));
        props.put("github", Map.of("type","string"));
        props.put("personalWebsite", Map.of("type","string"));
        props.put("professionalSummary", Map.of("type","string"));
        props.put("jobTitle", Map.of("type","string"));
        props.put("skills", Map.of("type","array", "items", Map.of("type","string")));
        schema.put("properties", props);
        schema.put("additionalProperties", true);
        return schema;
    }
}

