package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_record")
public class InventoryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String recordNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tank_id", nullable = false)
    private Tank tank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private OilProduct oilProduct;

    private LocalDate inventoryDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal openingVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal closingVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal gaugeVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal salesVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal theoreticalVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal differenceVolume;

    @Column(precision = 5, scale = 4)
    private BigDecimal lossRate;

    @Column(precision = 10, scale = 2)
    private BigDecimal waterLevel;

    @Column(precision = 5, scale = 2)
    private BigDecimal temperature;

    private Boolean gaugeNormal;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private DiscrepancyType discrepancyType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private InventoryStatus status;

    @Column(length = 50)
    private String stationManager;

    @Column(length = 50)
    private String gauger;

    @Column(length = 50)
    private String supervisor;

    @Column(length = 500)
    private String stationRemark;

    @Column(length = 500)
    private String gaugerRemark;

    @Column(length = 500)
    private String supervisorRemark;

    @Column(precision = 10, scale = 2)
    private BigDecimal adjustedVolume;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
