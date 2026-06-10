package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "instrument_package")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstrumentPackage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "package_code", unique = true, nullable = false, length = 50)
    private String packageCode;
    
    @Column(name = "package_name", nullable = false, length = 100)
    private String packageName;
    
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PackageStatus status;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    @OneToMany(mappedBy = "instrumentPackage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Instrument> instruments = new ArrayList<>();
    
    @OneToMany(mappedBy = "instrumentPackage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InventoryRecord> inventoryRecords = new ArrayList<>();
    
    @OneToMany(mappedBy = "instrumentPackage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SterilizationBatch> sterilizationBatches = new ArrayList<>();
    
    @OneToMany(mappedBy = "instrumentPackage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ReceiveRecord> receiveRecords = new ArrayList<>();
    
    @OneToMany(mappedBy = "instrumentPackage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AbnormalRecord> abnormalRecords = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
    
    public enum PackageStatus {
        PENDING_INVENTORY,
        INVENTORY_COMPLETED,
        PENDING_STERILIZATION,
        STERILIZATION_COMPLETED,
        PENDING_RECEIVE,
        RECEIVED,
        PENDING_REVIEW,
        RELEASED,
        ISSUED,
        RETURNED,
        ABNORMAL
    }
}