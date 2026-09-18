package com.medistock.dto;

import lombok.*;

/** Payload for adding or removing stock. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StockUpdateRequest {
    /** Positive number. The endpoint decides IN or OUT. */
    private Integer quantity;
    private String note;
}
