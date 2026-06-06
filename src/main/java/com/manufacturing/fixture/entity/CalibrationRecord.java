package com.manufacturing.fixture.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "calibration_records")
public class CalibrationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fixture_id", nullable = false)
    private Fixture fixture;

    @Column(nullable = false)
    private LocalDate calibrationDate;

    @Column(length = 100)
    private String calibrationAgency;

    @Column(length = 50)
    private String certificateNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CalibrationResult result;

    private LocalDate nextCalibrationDate;

    @Column(length = 50)
    private String calibrator;

    @Column(columnDefinition = "TEXT")
    private String remark;

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
