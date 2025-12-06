package com.example.Unmask.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CvData {

    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String linkedin;
    private String github;
    private String jobTitle;
    private String address;

    // SKILLS
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    // EDUCATION
    @Builder.Default
    private List<Education> educations = new ArrayList<>();

    // EXPERIENCE
    @Builder.Default
    private List<Experience> professionalExperiences = new ArrayList<>();

    // PROJECTS
    @Builder.Default
    private List<Project> projects = new ArrayList<>();


    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Education {
        private String institution;
        private String degree;
        private Integer startYear;
        private Integer endYear;
        private String description;
    }


    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Experience {
        private String title;
        private String companyName;
        private String location;
        private Integer startYear;
        private Integer endYear;
        private boolean ongoing;
        private String description;

        @Builder.Default
        private List<String> skills = new ArrayList<>();
    }


    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Project {
        private String name;
        private String description;
        private Integer startYear;
        private Integer endYear;

        @Builder.Default
        private List<String> skills = new ArrayList<>();
    }
}
