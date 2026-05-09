package com.example.Unmask.dto;

import lombok.Data;

/**
 * Request body for POST /api/auth/google.
 * The frontend sends the raw ID token obtained from Google Identity Services (GIS).
 */
@Data
public class GoogleAuthRequest {
    /** The credential string returned by Google Identity Services after the user selects an account. */
    private String idToken;
}
