package com.example.coldchain.entity;

import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.enums.ProductType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "waybill")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Waybill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "waybill_no", unique = true, nullable = false, length = 50)
    private String waybillNo;

    @Column(name = "origin", nullable = false, length = 100)
    private String origin;

    @Column(name = "destination", nullable = false, length = 100)
    private String destination;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 20)
    private ProductType productType;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "temperature_min", nullable = false)
    private BigDecimal temperatureMin;

    @Column(name = "temperature_max", nullable = false)
    private BigDecimal temperatureMax;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "driver_id")
    private Long driverId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private WaybillStatus status;

    @Column(name = "departure_time")
    private LocalDateTime departureTime;

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;

    @Column(name = "signed_time")
    private LocalDateTime signedTime;

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