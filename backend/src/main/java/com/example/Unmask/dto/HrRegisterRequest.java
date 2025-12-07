package com.example.Unmask.dto;

import lombok.Data;

@Data
public class HrRegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String company;
    private String position;
}