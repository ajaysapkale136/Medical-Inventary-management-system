package com.medistock.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RestockRequest {

    private Long supplierId;

    @NotNull
    @Min(1)
    private Integer quantity;

    private BigDecimal totalCost;

    private String note;
}
