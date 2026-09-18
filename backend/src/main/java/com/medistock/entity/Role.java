package com.medistock.entity;

/** The roles supported by MediStock. */
public enum Role {
    ADMIN,      // full access, can create PHARMACIST, STAFF and SUPPLIER
    PHARMACIST, // can create STAFF only
    STAFF,      // read + basic stock operations
    SUPPLIER    // can view inventory and add delivered stock only
}
