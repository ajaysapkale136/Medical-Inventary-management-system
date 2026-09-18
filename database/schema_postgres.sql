-- ============================================================
-- MediStock - PostgreSQL schema (production)
-- HOW TO RUN:  psql -U postgres -f schema_postgres.sql
-- ============================================================

DROP DATABASE IF EXISTS medistock;
CREATE DATABASE medistock;
\c medistock

CREATE TABLE users (
    id                 BIGSERIAL PRIMARY KEY,
    full_name          VARCHAR(100) NOT NULL,
    email              VARCHAR(150) NOT NULL UNIQUE,
    password           VARCHAR(255),
    phone              VARCHAR(20),
    role               VARCHAR(20) NOT NULL,
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    provider           VARCHAR(20) DEFAULT 'LOCAL',
    reset_token        VARCHAR(100),
    reset_token_expiry TIMESTAMP,
    created_at         TIMESTAMP DEFAULT NOW(),
    last_login_at      TIMESTAMP
);

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE suppliers (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20),
    email          VARCHAR(150),
    address        VARCHAR(255),
    rating         INT DEFAULT 5,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medicines (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    batch_number        VARCHAR(60) NOT NULL,
    category_id         BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id         BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    quantity            INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 20,
    manufacturing_date  DATE,
    expiry_date         DATE NOT NULL,
    price               NUMERIC(10,2) DEFAULT 0.00,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id                 BIGSERIAL PRIMARY KEY,
    medicine_id        BIGINT REFERENCES medicines(id) ON DELETE CASCADE,
    type               VARCHAR(20) NOT NULL,
    quantity           INT NOT NULL,
    resulting_quantity INT,
    note               VARCHAR(255),
    performed_by       VARCHAR(150),
    created_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchases (
    id            BIGSERIAL PRIMARY KEY,
    supplier_id   BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    medicine_id   BIGINT REFERENCES medicines(id) ON DELETE SET NULL,
    quantity      INT,
    total_cost    NUMERIC(12,2),
    purchase_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE notifications (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(20) NOT NULL,
    message    VARCHAR(255) NOT NULL,
    read_flag  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_med_name ON medicines(name);
CREATE INDEX idx_med_expiry ON medicines(expiry_date);
