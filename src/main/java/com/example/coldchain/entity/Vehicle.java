package com.example.coldchain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plate_number", unique = true, nullable = false, length = 20)
    private String plateNumber;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "refrigeration_type", length = 50)
    private String refrigerationType;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}