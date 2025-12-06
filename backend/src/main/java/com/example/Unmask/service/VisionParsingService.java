package com.example.Unmask.service;

import com.example.Unmask.dto.CvData;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisionParsingService {

    @Value("${groq.api-key}")
    private String groqApiKey;

    private final PdfImageService pdfImageService;
    private final ObjectMapper mapper = new ObjectMapper();

    private Map<String, Object> cvSchema;
    private Map<String, Object> linkedinSchema;

    @PostConstruct
    public void init() {
        cvSchema = buildCvSchema();
        linkedinSchema = buildLinkedinSchema();
    }

    // ===================================================================
    // PUBLIC API
    // ===================================================================

    public CvData parseCvPdf(Path pdfPath, String suffix) {
        Path outDir = pdfPath.getParent().resolve("cv_images_" + suffix);
        List<Path> images = pdfImageService.convertPdfToImages(pdfPath, outDir);

        List<CvData> pages = new ArrayList<>();
        for (Path img : images) {
            try {
                String b64 = encode(img);
                Map<String, Object> raw = callGroqVision(b64, "cv");
                pages.add(cleanRaw(raw, "cv"));
            } catch (Exception ex) {
                log.warn("CV parsing failed on {}: {}", img, ex.getMessage());
            }
        }
        cleanup(outDir);
        return merge(pages);
    }

    public CvData parseLinkedinPdf(Path pdfPath, String suffix) {
        Path outDir = pdfPath.getParent().resolve("linkedin_images_" + suffix);
        List<Path> images = pdfImageService.convertPdfToImages(pdfPath, outDir);

        List<CvData> pages = new ArrayList<>();
        for (Path img : images) {
            try {
                String b64 = encode(img);
                Map<String, Object> raw = callGroqVision(b64, "linkedin");
                pages.add(cleanRaw(raw, "linkedin"));
            } catch (Exception ex) {
                log.warn("LinkedIn parsing failed on {}: {}", img, ex.getMessage());
            }
        }
        cleanup(outDir);
        return merge(pages);
    }

    // ===================================================================
    // GROQ VISION STRICT CALL WITH RETRY
    // ===================================================================

    @SuppressWarnings("unchecked")
    private Map<String, Object> callGroqVision(String base64, String type) throws Exception {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        String system = """
You are an expert CV/LinkedIn parser.
Return ONLY a JSON object that matches the schema.
No explanations. No text outside JSON.
NO extra fields. NO hallucinations.
""";

        Map<String, Object> schema = type.equals("cv") ? cvSchema : linkedinSchema;
        String schemaJson = mapper.writeValueAsString(schema);

        String userPrompt =
                (type.equals("cv") ? "Parse this CV page using schema:\n" :
                        "Parse this LinkedIn page using schema:\n")
                        + schemaJson + "\nReturn ONLY JSON.";

        List<Map<String, Object>> contentList = List.of(
                Map.of("type", "text", "text", userPrompt),
                Map.of("type", "image_url", "image_url",
                        Map.of("url", "data:image/png;base64," + base64))
        );

        Map<String, Object> body = new HashMap<>();
        body.put("model", "meta-llama/llama-4-maverick-17b-128e-instruct");
        body.put("messages", List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", contentList)
        ));
        body.put("response_format", Map.of("type", "json_object"));
        body.put("temperature", 0);

        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(groqApiKey);
        h.setContentType(MediaType.APPLICATION_JSON);

        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(10_000);
        rf.setReadTimeout(30_000);
        RestTemplate rt = new RestTemplate(rf);

        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), h);

        ResponseEntity<String> resp = callWithRetry(rt, url, entity);

        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
            log.warn("Groq Vision failed after retries. status={} body={}",
                    resp.getStatusCode(), resp.getBody());
            return Map.of();
        }

        Map<String, Object> json = mapper.readValue(resp.getBody(), new TypeReference<>() {});
        List<?> choices = (List<?>) json.get("choices");
        if (choices == null || choices.isEmpty()) return Map.of();

        Map<String, Object> msg = (Map<String, Object>) ((Map<?, ?>) choices.get(0)).get("message");
        if (msg == null) return Map.of();

        String content = Objects.toString(msg.get("content"), "");
        try {
            return mapper.readValue(content, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private ResponseEntity<String> callWithRetry(RestTemplate rt,
                                                 String url,
                                                 HttpEntity<String> entity) {
        int maxRetries = 4;
        long baseDelayMs = 500L;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            ResponseEntity<String> resp;
            try {
                resp = rt.postForEntity(url, entity, String.class);
            } catch (Exception ex) {
                if (attempt == maxRetries) {
                    log.warn("Groq call failed (network) after {} attempts: {}",
                            attempt + 1, ex.getMessage());
                    throw ex;
                }
                long delayMs = (long) (baseDelayMs * Math.pow(2, attempt));
                sleep(delayMs);
                continue;
            }

            int status = resp.getStatusCode().value();

            if (status >= 200 && status < 300) {
                return resp;
            }

            if ((status == 429 || status >= 500) && attempt < maxRetries) {
                long delayMs = computeDelayMs(resp, baseDelayMs, attempt);
                log.warn("Groq call got status {} – retrying in {} ms (attempt {}/{})",
                        status, delayMs, attempt + 1, maxRetries);
                sleep(delayMs);
                continue;
            }

            return resp;
        }

        return new ResponseEntity<>(HttpStatus.TOO_MANY_REQUESTS);
    }

    private long computeDelayMs(ResponseEntity<String> resp,
                                long baseDelayMs,
                                int attempt) {
        String retryAfter = resp.getHeaders().getFirst("retry-after");
        if (retryAfter != null) {
            try {
                return Long.parseLong(retryAfter) * 1000L;
            } catch (NumberFormatException ignore) { }
        }
        long backoff = (long) (baseDelayMs * Math.pow(2, attempt));
        long jitter = new Random().nextInt(250);
        return backoff + jitter;
    }

    private void sleep(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    // ===================================================================
    // CLEAN RAW JSON INTO CvData (with nullable checks)
    // ===================================================================

    @SuppressWarnings("unchecked")
    private CvData cleanRaw(Map<String, Object> raw, String type) {
        if (raw == null || raw.isEmpty()) return empty();

        CvData.CvDataBuilder b = CvData.builder();

        if (type.equals("linkedin")) {
            String name = opt(raw, "name");
            String[] parts = name.trim().isEmpty() ? new String[0] : name.trim().split("\\s+", 2);
            b.firstName(parts.length > 0 ? parts[0] : "");
            b.lastName(parts.length > 1 ? parts[1] : "");
            b.jobTitle(opt(raw, "jobTitle"));
            b.address(opt(raw, "location"));

            Object contactObj = raw.get("contact");
            if (contactObj instanceof Map<?, ?> contactMap) {
                Map<String, Object> contact = cast(contactMap);
                if (contact.containsKey("email")) b.email(opt(contact, "email"));
                if (contact.containsKey("phone")) b.phone(opt(contact, "phone"));
            } else {
                if (raw.containsKey("email")) b.email(opt(raw, "email"));
                if (raw.containsKey("phone")) b.phone(opt(raw, "phone"));
            }

            if (raw.containsKey("linkedin")) b.linkedin(opt(raw, "linkedin"));
            if (raw.containsKey("github")) b.github(opt(raw, "github"));
        } else {
            b.firstName(opt(raw, "firstName"));
            b.lastName(opt(raw, "lastName"));
            if (raw.containsKey("email")) b.email(opt(raw, "email"));
            if (raw.containsKey("phone")) b.phone(opt(raw, "phone"));
            if (raw.containsKey("github")) b.github(opt(raw, "github"));
            if (raw.containsKey("linkedin")) b.linkedin(opt(raw, "linkedin"));
            b.jobTitle(opt(raw, "jobTitle"));
            if (raw.containsKey("address")) b.address(opt(raw, "address"));
        }

        Object skillsObj = raw.get("skills");
        if (skillsObj instanceof List<?> s) {
            List<String> skills = new ArrayList<>();
            for (Object o : s) {
                if (o != null) skills.add(o.toString());
            }
            b.skills(skills);
        } else {
            b.skills(List.of());
        }

        b.educations(parseEducations(raw.get("educations")));
        b.professionalExperiences(parseExperiences(raw.get("professionalExperiences")));
        b.projects(parseProjects(raw.get("projects")));

        return b.build();
    }

    private List<CvData.Project> parseProjects(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<CvData.Project> out = new ArrayList<>();

        for (Object o : list) {
            if (!(o instanceof Map<?, ?> raw)) continue;
            Map<String, Object> m = cast(raw);

            out.add(CvData.Project.builder()
                    .name(opt(m, "name"))
                    .description(opt(m, "description"))
                    .startYear(parseInt(m.get("startYear")))
                    .endYear(parseInt(m.get("endYear")))
                    .skills((List<String>) m.getOrDefault("skills", List.of()))
                    .build()
            );
        }
        return out;
    }

    private List<CvData.Experience> parseExperiences(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<CvData.Experience> out = new ArrayList<>();

        for (Object o : list) {
            if (!(o instanceof Map<?, ?> raw)) continue;
            Map<String, Object> m = cast(raw);

            out.add(CvData.Experience.builder()
                    .title(opt(m, "title"))
                    .companyName(opt(m, "companyName"))
                    .location(opt(m, "location"))
                    .description(opt(m, "description"))
                    .startYear(parseInt(m.get("startYear")))
                    .endYear(parseInt(m.get("endYear")))
                    .ongoing(Boolean.TRUE.equals(m.get("ongoing")))
                    .skills((List<String>) m.getOrDefault("skills", List.of()))
                    .build()
            );
        }
        return out;
    }

    private List<CvData.Education> parseEducations(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<CvData.Education> out = new ArrayList<>();

        for (Object o : list) {
            if (!(o instanceof Map<?, ?> raw)) continue;
            Map<String, Object> m = cast(raw);

            out.add(CvData.Education.builder()
                    .institution(opt(m, "institution"))
                    .degree(opt(m, "degree"))
                    .startYear(parseInt(m.get("startYear")))
                    .endYear(parseInt(m.get("endYear")))
                    .description(opt(m, "description"))
                    .build()
            );
        }
        return out;
    }

    // ===================================================================
    // MERGE PAGES
    // ===================================================================

    private CvData merge(List<CvData> list) {
        if (list == null || list.isEmpty()) return empty();

        CvData out = empty();

        for (CvData d : list) {
            if (isNotBlank(d.getFirstName())) out.setFirstName(d.getFirstName());
            if (isNotBlank(d.getLastName())) out.setLastName(d.getLastName());
            if (isNotBlank(d.getEmail())) out.setEmail(d.getEmail());
            if (isNotBlank(d.getPhone())) out.setPhone(d.getPhone());
            if (isNotBlank(d.getGithub())) out.setGithub(d.getGithub());
            if (isNotBlank(d.getLinkedin())) out.setLinkedin(d.getLinkedin());
            if (isNotBlank(d.getJobTitle())) out.setJobTitle(d.getJobTitle());
            if (isNotBlank(d.getAddress())) out.setAddress(d.getAddress());

            out.getSkills().addAll(d.getSkills());
            out.getEducations().addAll(d.getEducations());
            out.getProfessionalExperiences().addAll(d.getProfessionalExperiences());
            out.getProjects().addAll(d.getProjects());
        }

        out.setSkills(new ArrayList<>(new LinkedHashSet<>(out.getSkills())));
        return out;
    }

    // ===================================================================
    // SCHEMAS (STRICT)
    // ===================================================================

    private Map<String, Object> buildCvSchema() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("firstName", str());
        props.put("lastName", str());
        props.put("email", str());
        props.put("phone", str());
        props.put("linkedin", str());
        props.put("github", str());
        props.put("jobTitle", str());
        // props.put("address", str());

        props.put("skills", arr(str()));

        props.put("educations", arr(obj(Map.of(
                "institution", str(),
                "degree", str(),
                "startYear", integer(),
                "endYear", integer(),
                "description", str()
        ))));

        props.put("professionalExperiences", arr(obj(Map.of(
                "title", str(),
                "companyName", str(),
                "location", str(),
                "description", str(),
                "startYear", integer(),
                "endYear", integer(),
                "ongoing", bool(),
                "skills", arr(str())
        ))));

        props.put("projects", arr(obj(Map.of(
                "name", str(),
                "description", str(),
                "startYear", integer(),
                "endYear", integer(),
                "skills", arr(str())
        ))));

        return Map.of("type", "object", "properties", props, "additionalProperties", false);
    }

    private Map<String, Object> buildLinkedinSchema() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("name", str());
        props.put("jobTitle", str());
        props.put("location", str());
        props.put("email", str());
        // props.put("phone", str());
        props.put("linkedin", str());
        // props.put("github", str());
        props.put("skills", arr(str()));

        props.put("educations", arr(obj(Map.of(
                "institution", str(),
                "degree", str()
        ))));

        return Map.of("type", "object", "properties", props, "additionalProperties", false);
    }

    private Map<String, Object> str() { return Map.of("type", "string"); }
    private Map<String, Object> bool() { return Map.of("type", "boolean"); }
    private Map<String, Object> integer() { return Map.of("type", "integer"); }
    private Map<String, Object> arr(Object items) { return Map.of("type", "array", "items", items); }
    private Map<String, Object> obj(Object props) { return Map.of("type", "object", "properties", props); }

    // ===================================================================
    // HELPERS
    // ===================================================================

    private Integer parseInt(Object o) {
        try {
            return (o == null) ? null : Integer.parseInt(o.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private String opt(Map<String, Object> m, String key) {
        if (m == null) return "";
        Object v = m.get(key);
        return v == null ? "" : v.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> cast(Object o) {
        return (Map<String, Object>) o;
    }

    private boolean isNotBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private CvData empty() {
        return CvData.builder()
                .skills(new ArrayList<>())
                .educations(new ArrayList<>())
                .professionalExperiences(new ArrayList<>())
                .projects(new ArrayList<>())
                .build();
    }

    private String encode(Path p) throws Exception {
        return Base64.getEncoder().encodeToString(Files.readAllBytes(p));
    }

    private void cleanup(Path dir) {
        try {
            if (!Files.exists(dir)) return;
            Files.walk(dir).sorted(Comparator.reverseOrder())
                    .forEach(f -> {
                        try { Files.deleteIfExists(f); } catch (Exception ignore) { }
                    });
        } catch (Exception ignore) { }
    }
}
