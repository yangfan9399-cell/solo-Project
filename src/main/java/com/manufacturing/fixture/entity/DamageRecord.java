package com.manufacturing.fixture.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "damage_records")
public class DamageRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fixture_id", nullable = false)
    private Fixture fixture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrow_record_id")
    private BorrowRecord borrowRecord;

    @Column(length = 50)
    private String damageType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "occurrence_time")
    private LocalDateTime occurrenceTime;

    @Column(length = 50)
    private String reporter;

    @Column(length = 50)
    private String productionLine;

    private BigDecimal repairCost;

    private Integer downtimeHours;

    @Column(columnDefinition = "TEXT")
    private String handlingMeasures;

    @Column(length = 50)
    private String handler;

    @Column(name = "created_at")
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
