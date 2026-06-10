package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "inventory_no", unique = true, nullable = false, length = 50)
    private String inventoryNo;
    
    @Column(name = "actual_quantity", nullable = false)
    private Integer actualQuantity;
    
    @Column(name = "expected_quantity", nullable = false)
    private Integer expectedQuantity;
    
    @Column(name = "result", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private InventoryResult result;
    
    @Column(name = "operator", nullable = false, length = 50)
    private String operator;
    
    @Column(name = "notes", length = 500)
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private InstrumentPackage instrumentPackage;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
    
    public enum InventoryResult {
        NORMAL,
        MISSING,
        EXTRA
    }
}