package com.medistock.dto;

import lombok.*;

/** Simple {"message": "..."} JSON response. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ApiMessage {
    private String message;
}
