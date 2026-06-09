package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_history")
public class InventoryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private InventoryRecord inventoryRecord;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private InventoryStatus actionType;

    @Column(length = 50)
    private String operator;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private UserRole operatorRole;

    @Column(length = 500)
    private String remark;

    private LocalDateTime actionTime;

    @PrePersist
    protected void onCreate() {
        actionTime = LocalDateTime.now();
    }
}
