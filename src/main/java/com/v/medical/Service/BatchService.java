package com.v.medical.Service;

import com.v.medical.entity.Batch;
import com.v.medical.entity.Medicine;
import com.v.medical.repository.BatchRepository;
import com.v.medical.repository.MedicineRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final MedicineRepository medicineRepository;

    public BatchService(
            BatchRepository batchRepository,
            MedicineRepository medicineRepository) {

        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
    }

    // Get all batches
    public List<Batch> getAllBatches() {

        return batchRepository.findAll();
    }

    // Get active batches
    public List<Batch> getActiveBatches() {

        return batchRepository.findByActiveTrue();
    }

    // Get batch by ID
    public Batch getBatchById(Long id) {

        return batchRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Batch not found with id: " + id
                        ));
    }

    // Get batches of a medicine
    public List<Batch> getBatchesByMedicine(
            Long medicineId) {

        return batchRepository.findByMedicineId(
                medicineId
        );
    }

    // Search batch number
    public List<Batch> searchBatches(
            String batchNumber) {

        return batchRepository
                .findByBatchNumberContainingIgnoreCase(
                        batchNumber
                );
    }

    // Get expiring batches
    public List<Batch> getExpiringBatches(
            int days) {

        LocalDate today = LocalDate.now();

        LocalDate futureDate =
                today.plusDays(days);

        return batchRepository.findByExpiryDateBetween(
                today,
                futureDate
        );
    }

    // Get expired batches
    public List<Batch> getExpiredBatches() {

        return batchRepository.findByExpiryDateBefore(
                LocalDate.now()
        );
    }

    // Create batch
    public Batch createBatch(
            Long medicineId,
            Batch batch) {

        if (batchRepository.existsByBatchNumber(
                batch.getBatchNumber())) {

            throw new RuntimeException(
                    "Batch number already exists"
            );
        }

        Medicine medicine =
                medicineRepository.findById(medicineId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Medicine not found"
                                ));

        if (batch.getManufacturingDate() == null) {

            throw new RuntimeException(
                    "Manufacturing date is required"
            );
        }

        if (batch.getExpiryDate() == null) {

            throw new RuntimeException(
                    "Expiry date is required"
            );
        }

        if (!batch.getExpiryDate()
                .isAfter(batch.getManufacturingDate())) {

            throw new RuntimeException(
                    "Expiry date must be after manufacturing date"
            );
        }

        if (batch.getQuantity() == null ||
                batch.getQuantity() < 0) {

            throw new RuntimeException(
                    "Quantity cannot be negative"
            );
        }

        batch.setMedicine(medicine);
        batch.setActive(true);

        return batchRepository.save(batch);
    }

    // Update batch
    public Batch updateBatch(
            Long id,
            Batch updatedBatch) {

        Batch existing =
                getBatchById(id);

        existing.setManufacturingDate(
                updatedBatch.getManufacturingDate()
        );

        existing.setExpiryDate(
                updatedBatch.getExpiryDate()
        );

        existing.setQuantity(
                updatedBatch.getQuantity()
        );

        if (!updatedBatch.getExpiryDate()
                .isAfter(
                        updatedBatch.getManufacturingDate()
                )) {

            throw new RuntimeException(
                    "Expiry date must be after manufacturing date"
            );
        }

        return batchRepository.save(existing);
    }

    // Update quantity
    public Batch updateQuantity(
            Long id,
            Integer quantity) {

        if (quantity == null || quantity < 0) {

            throw new RuntimeException(
                    "Quantity cannot be negative"
            );
        }

        Batch batch = getBatchById(id);

        batch.setQuantity(quantity);

        return batchRepository.save(batch);
    }

    // Soft delete
    public void deleteBatch(Long id) {

        Batch batch =
                getBatchById(id);

        batch.setActive(false);

        batchRepository.save(batch);
    }
}