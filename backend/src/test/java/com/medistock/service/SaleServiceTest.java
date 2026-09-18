package com.medistock.service;

import com.medistock.dto.SaleDtos.SaleItemRequest;
import com.medistock.dto.SaleDtos.SaleRequest;
import com.medistock.dto.SaleDtos.SaleResponse;
import com.medistock.entity.Medicine;
import com.medistock.entity.Sale;
import com.medistock.repository.SaleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private MedicineService medicineService;

    @Mock
    private SaleRepository saleRepository;

    @InjectMocks
    private SaleService saleService;

    @Test
    void processSale_shouldPersistSaleAndCalculateTotal() {
        Medicine medicine = new Medicine();
        medicine.setId(10L);
        medicine.setName("Paracetamol");
        medicine.setPrice(new BigDecimal("25.00"));

        when(medicineService.findById(10L)).thenReturn(medicine);
        when(saleRepository.save(any())).thenAnswer(invocation -> {
            Sale sale = invocation.getArgument(0, Sale.class);
            sale.setId(99L);
            return sale;
        });

        SaleRequest request = new SaleRequest();
        request.setCustomerName("Alice Johnson");
        request.setCustomerPhone("0712345678");
        request.setItems(List.of(new SaleItemRequest(10L, 2)));

        SaleResponse response = saleService.processSale(request, "Admin User");

        assertNotNull(response);
        assertEquals(99L, response.getSaleId());
        assertEquals("Alice Johnson", response.getCustomerName());
        assertEquals(new BigDecimal("50.00"), response.getTotal());
        assertEquals(1, response.getItems().size());
        assertEquals("Paracetamol", response.getItems().get(0).getName());
        verify(medicineService).removeStock(10L, 2, "Sold via POS", "Admin User");
        verify(saleRepository, times(1)).save(any());
    }
}
