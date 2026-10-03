-- V2: Ward Stock Transfers and Tamper-Proof Audit Trail (GxP Compliance)

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `timestamp` datetime(6) NOT NULL,
  `actor` varchar(150) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `ip_address` varchar(60) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `old_value` varchar(2000) DEFAULT NULL,
  `new_value` varchar(2000) DEFAULT NULL,
  `reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_timestamp` (`timestamp`),
  KEY `idx_audit_actor` (`actor`),
  KEY `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `stock_transfers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transfer_number` varchar(50) NOT NULL,
  `from_location` varchar(100) NOT NULL,
  `to_location` varchar(100) NOT NULL,
  `medicine_id` bigint NOT NULL,
  `batch_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  `urgency` enum('ROUTINE','URGENT','STAT_EMERGENCY') NOT NULL DEFAULT 'ROUTINE',
  `status` enum('REQUESTED','APPROVED','DISPATCHED','RECEIVED','REJECTED') NOT NULL DEFAULT 'REQUESTED',
  `requested_by` varchar(100) NOT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `dispatched_by` varchar(100) DEFAULT NULL,
  `received_by` varchar(100) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_transfer_number` (`transfer_number`),
  KEY `FK_transfer_medicine` (`medicine_id`),
  KEY `FK_transfer_batch` (`batch_id`),
  CONSTRAINT `FK_transfer_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  CONSTRAINT `FK_transfer_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
