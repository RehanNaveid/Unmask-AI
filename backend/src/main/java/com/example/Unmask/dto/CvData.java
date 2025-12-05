package com.example.Unmask.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvData {

    private String lastName;
    private String firstName;
    private String address;
    private String email;
    private String phone;
    private String linkedin;
    private String github;
    private String personalWebsite;
    private String professionalSummary;
    private String jobTitle;

    private List<Experience> professionalExperiences;
    private List<Experience> otherExperiences;
    private List<Education> educations;
    private List<String> skills;
    private List<Language> languages;
    private List<String> publications;
    private List<String> distinctions;
    private List<String> hobbies;
    private List<String> references;
    private List<Certification> certifications;

    private Map<String,Object> other;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Experience {
        private String companyName;
        private String title;
        private String location;
        private String type;
        private Integer startYear;
        private Integer startMonth;
        private Integer endYear;
        private Integer endMonth;
        private Boolean ongoing;
        private String description;
        private List<String> associatedSkills;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Education {
        private String degree;
        private String institution;
        private String location;
        private Integer startYear;
        private Integer startMonth;
        private Integer endYear;
        private Integer endMonth;
        private Boolean ongoing;
        private String description;
        private List<String> associatedSkills;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Language {
        private String language;
        private String level;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Certification {
        private String title;
        private String issuer;
        private Integer issuedYear;
        private Integer issuedMonth;
    }
}
