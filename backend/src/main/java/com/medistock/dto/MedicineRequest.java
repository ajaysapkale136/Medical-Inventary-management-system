package com.medistock.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Payload used to create or update a medicine. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MedicineRequest {

    @NotBlank private String name;
    @NotBlank private String batchNumber;
    private Long categoryId;
    private Long supplierId;
    @Min(0) private Integer quantity = 0;
    @Min(0) private Integer lowStockThreshold = 20;
    private LocalDate manufacturingDate;
    @NotNull private LocalDate expiryDate;
    @DecimalMin("0.0") private BigDecimal price = BigDecimal.ZERO;
}
