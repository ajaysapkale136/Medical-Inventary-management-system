package com.medistock.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SaleDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SaleItemRequest {
        private Long medicineId;
        private Integer quantity;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SaleRequest {
        private List<SaleItemRequest> items;
        private String customerName;
        private String customerPhone;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SaleItemResponse {
        private Long medicineId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SaleResponse {
        private Long saleId;
        private List<SaleItemResponse> items;
        private BigDecimal total;
        private LocalDateTime createdAt;
        private String customerName;
        private String customerPhone;
        private String soldBy;
    }
}
