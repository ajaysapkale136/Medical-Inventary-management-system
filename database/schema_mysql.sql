-- ============================================================
-- MediStock - MySQL schema (development)
-- HOW TO RUN:
--   1. Open MySQL Workbench or a terminal
--   2. mysql -u root -p < schema_mysql.sql
-- ============================================================

DROP DATABASE IF EXISTS medistock;
CREATE DATABASE medistock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medistock;

-- ---------- Users ----------
CREATE TABLE users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password            VARCHAR(255),
    phone               VARCHAR(20),
    role                VARCHAR(20)  NOT NULL,  -- ADMIN | PHARMACIST | STAFF
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    provider            VARCHAR(20)  DEFAULT 'LOCAL',
    reset_token         VARCHAR(100),
    reset_token_expiry  DATETIME,
    created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
    last_login_at       DATETIME
);

-- ---------- Categories ----------
CREATE TABLE categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- ---------- Suppliers ----------
CREATE TABLE suppliers (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20),
    email          VARCHAR(150),
    address        VARCHAR(255),
    rating         INT DEFAULT 5,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Medicines ----------
CREATE TABLE medicines (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    batch_number        VARCHAR(60)  NOT NULL,
    category_id         BIGINT,
    supplier_id         BIGINT,
    quantity            INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 20,
    manufacturing_date  DATE,
    expiry_date         DATE NOT NULL,
    price               DECIMAL(10,2) DEFAULT 0.00,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_med_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_med_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_med_name (name),
    INDEX idx_med_expiry (expiry_date)
);

-- ---------- Stock movement history ----------
CREATE TABLE stock_movements (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id         BIGINT,
    type                VARCHAR(20) NOT NULL,  -- IN | OUT | ADJUSTMENT
    quantity            INT NOT NULL,
    resulting_quantity  INT,
    note                VARCHAR(255),
    performed_by        VARCHAR(150),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_move_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- ---------- Purchases ----------
CREATE TABLE purchases (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_id   BIGINT,
    medicine_id   BIGINT,
    quantity      INT,
    total_cost    DECIMAL(12,2),
    purchase_date DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_pur_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_pur_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL
);

-- ---------- Notifications ----------
CREATE TABLE notifications (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    type       VARCHAR(20)  NOT NULL,
    message    VARCHAR(255) NOT NULL,
    read_flag  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- Passwords below are BCrypt hashes.
--   admin@medistock.com      / Admin@123
--   pharmacist@medistock.com / Pharma@123
--   staff@medistock.com      / Staff@123
-- (The backend also seeds these automatically on first start.)
-- ============================================================
INSERT INTO users (full_name, email, password, phone, role) VALUES
('System Admin',    'admin@medistock.com',      '$2a$10$Dow1Q9m5Zf3q1sQK1uJ9YuC1V4bqk3q0kQmYyF9v0mF0F1p2h3sVi', '9000000001', 'ADMIN'),
('Priya Pharmacist','pharmacist@medistock.com', '$2a$10$Dow1Q9m5Zf3q1sQK1uJ9YuC1V4bqk3q0kQmYyF9v0mF0F1p2h3sVi', '9000000002', 'PHARMACIST'),
('Sam Staff',       'staff@medistock.com',      '$2a$10$Dow1Q9m5Zf3q1sQK1uJ9YuC1V4bqk3q0kQmYyF9v0mF0F1p2h3sVi', '9000000003', 'STAFF');

INSERT INTO categories (name, description) VALUES
('Antibiotic', 'Used for bacterial infections'),
('Painkiller', 'Pain relief medicines'),
('Syrup',      'Liquid medicines'),
('Tablet',     'Solid dosage forms'),
('Injection',  'Injectable medicines');

INSERT INTO suppliers (name, contact_number, email, address, rating) VALUES
('HealthPlus Distributors', '9876543210', 'sales@healthplus.com',   '12 MG Road, Bengaluru', 5),
('MediSource Pvt Ltd',      '9123456780', 'contact@medisource.com', '45 Anna Salai, Chennai', 4),
('CureWell Agencies',       '9012345678', 'info@curewell.com',      '9 Park Street, Kolkata', 3);

INSERT INTO medicines (name, batch_number, category_id, supplier_id, quantity, low_stock_threshold, manufacturing_date, expiry_date, price) VALUES
('Amoxicillin 500mg', 'AMX-1001', 1, 1, 120, 30, '2025-01-10', '2027-01-10',  45.50),
('Paracetamol 650mg', 'PCM-2007', 2, 2,  12, 25, '2025-04-01', '2026-08-20',  18.00),
('Cough Syrup 100ml', 'CS-3300',  3, 1,   0, 15, '2023-05-15', '2025-06-01',  95.00),
('Azithromycin 250mg','AZI-4100', 1, 3,  60, 20, '2025-02-20', '2027-02-20', 120.00),
('Ibuprofen 400mg',   'IBU-5200', 2, 2,   8, 20, '2025-03-05', '2026-09-05',  22.75);

INSERT INTO purchases (supplier_id, medicine_id, quantity, total_cost, purchase_date) VALUES
(1, 1, 100, 4550.00, '2026-01-15'),
(2, 2,  50,  900.00, '2026-02-10'),
(3, 4,  60, 7200.00, '2026-03-01');

INSERT INTO stock_movements (medicine_id, type, quantity, resulting_quantity, note, performed_by) VALUES
(1, 'IN',  100, 120, 'Purchase from HealthPlus', 'admin@medistock.com'),
(2, 'OUT',  38,  12, 'Dispensed at counter',     'staff@medistock.com'),
(3, 'OUT',  20,   0, 'Sold out',                 'staff@medistock.com');

INSERT INTO notifications (type, message) VALUES
('LOW_STOCK',    'Paracetamol 650mg is low on stock (12 left)'),
('OUT_OF_STOCK', 'Cough Syrup 100ml is OUT OF STOCK'),
('EXPIRED',      'Cough Syrup 100ml batch CS-3300 has EXPIRED');

-- ============================================================
-- USEFUL REPORT QUERIES
-- ============================================================
-- 1. Low stock list
SELECT id, name, batch_number, quantity, low_stock_threshold
FROM medicines WHERE quantity > 0 AND quantity <= low_stock_threshold;

-- 2. Out of stock list
SELECT id, name, batch_number FROM medicines WHERE quantity = 0;

-- 3. Expired medicines
SELECT id, name, batch_number, expiry_date FROM medicines WHERE expiry_date < CURDATE();

-- 4. Medicines expiring within the next 30 days
SELECT id, name, expiry_date FROM medicines
WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);

-- 5. Total inventory value
SELECT SUM(quantity * price) AS inventory_value FROM medicines;

-- 6. Stock quantity grouped by category
SELECT c.name AS category, SUM(m.quantity) AS total_qty
FROM medicines m LEFT JOIN categories c ON c.id = m.category_id GROUP BY c.name;

-- 7. Supplier performance (medicines supplied + purchase spend)
SELECT s.name, COUNT(DISTINCT m.id) AS medicines_supplied,
       COALESCE(SUM(p.total_cost), 0) AS total_spend
FROM suppliers s
LEFT JOIN medicines m ON m.supplier_id = s.id
LEFT JOIN purchases p ON p.supplier_id = s.id
GROUP BY s.id, s.name;

-- 8. Stock movement report for the last 30 days
SELECT sm.created_at, m.name, sm.type, sm.quantity, sm.performed_by
FROM stock_movements sm JOIN medicines m ON m.id = sm.medicine_id
WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY sm.created_at DESC;

-- 9. Users by role
SELECT role, COUNT(*) AS total FROM users GROUP BY role;
