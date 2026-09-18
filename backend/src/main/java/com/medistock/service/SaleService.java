package com.medistock.service;

import com.medistock.dto.SaleDtos.*;
import com.medistock.entity.Medicine;
import com.medistock.entity.Sale;
import com.medistock.entity.SaleItem;
import com.medistock.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final MedicineService medicineService;
    private final SaleRepository saleRepository;

    @Transactional
    public SaleResponse processSale(SaleRequest request, String performedBy) {
        List<SaleItemResponse> items = new ArrayList<>();
        Sale sale = Sale.builder()
                .customerName(request.getCustomerName() == null ? "Walk-in Customer" : request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .soldBy(performedBy)
                .createdAt(LocalDateTime.now())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (SaleItemRequest it : request.getItems()) {
            Medicine med = medicineService.findById(it.getMedicineId());
            int qty = it.getQuantity() == null ? 0 : it.getQuantity();
            if (qty <= 0) throw new IllegalArgumentException("Quantity must be greater than zero");

            BigDecimal unit = med.getPrice() == null ? BigDecimal.ZERO : med.getPrice();
            medicineService.removeStock(med.getId(), qty, "Sold via POS", performedBy);

            BigDecimal line = unit.multiply(BigDecimal.valueOf(qty));
            total = total.add(line);

            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .medicineId(med.getId())
                    .medicineName(med.getName())
                    .quantity(qty)
                    .unitPrice(unit)
                    .lineTotal(line)
                    .build();
            sale.getItems().add(saleItem);

            items.add(SaleItemResponse.builder()
                    .medicineId(med.getId())
                    .name(med.getName())
                    .quantity(qty)
                    .unitPrice(unit)
                    .lineTotal(line)
                    .build());
        }

        sale.setTotal(total);
        Sale saved = saleRepository.save(sale);

        return SaleResponse.builder()
            .saleId(saved.getId())
            .items(items)
            .total(total)
            .createdAt(saved.getCreatedAt())
            .customerName(saved.getCustomerName())
            .customerPhone(saved.getCustomerPhone())
            .soldBy(saved.getSoldBy())
            .build();
    }

    public List<SaleResponse> findAllForAdmin() {
        return saleRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public Sale findById(Long saleId) {
        return saleRepository.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Sale not found: " + saleId));
    }

    private SaleResponse toResponse(Sale sale) {
        List<SaleItemResponse> items = sale.getItems().stream()
                .map(i -> SaleItemResponse.builder()
                        .medicineId(i.getMedicineId())
                        .name(i.getMedicineName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getLineTotal())
                        .build())
                .toList();

        return SaleResponse.builder()
                .saleId(sale.getId())
                .items(items)
                .total(sale.getTotal())
                .createdAt(sale.getCreatedAt())
                .customerName(sale.getCustomerName())
                .customerPhone(sale.getCustomerPhone())
                .soldBy(sale.getSoldBy())
                .build();
    }
}
