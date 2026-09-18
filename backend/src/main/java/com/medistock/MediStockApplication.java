package com.medistock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class MediStockApplication {

    public static void main(String[] args) {
        SpringApplication.run(MediStockApplication.class, args);
    }
}










// | Role       | Email                      | Password    |
// |------------|----------------------------|-------------|
// | Admin      | admin@medistock.com        | Admin@123   |
// | Pharmacist | pharmacist@medistock.com   | Pharma@123  |
// | Staff      | staff@medistock.com        | Staff@123   |
// | Supplier   | supplier@medistock.com     | Supplier@123|
