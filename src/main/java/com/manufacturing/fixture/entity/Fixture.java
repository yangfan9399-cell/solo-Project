package com.manufacturing.fixture.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "fixtures")
public class Fixture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String fixtureNo;

    @Column(nullable = false, length = 100)
    private String fixtureName;

    @Column(nullable = false, length = 50)
    private String fixtureType;

    @Column(length = 200)
    private String applicableProcess;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FixtureStatus status;

    @Column(length = 100)
    private String location;

    @Column(length = 50)
    private String responsiblePerson;

    @Column(length = 100)
    private String calibrationCertificate;

    private LocalDate lastCalibrationDate;

    private LocalDate nextCalibrationDate;

    @Column(columnDefinition = "TEXT")
    private String description;

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

    public boolean isCalibrationExpired() {
        if (nextCalibrationDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(nextCalibrationDate);
    }

    public boolean isCalibrationWarning() {
        if (nextCalibrationDate == null) {
            return false;
        }
        return LocalDate.now().plusDays(7).isAfter(nextCalibrationDate);
    }

    public long getCalibrationExpiredDays() {
        if (nextCalibrationDate == null || !isCalibrationExpired()) {
            return 0;
        }
        return ChronoUnit.DAYS.between(nextCalibrationDate, LocalDate.now());
    }

    public long getDaysUntilCalibration() {
        if (nextCalibrationDate == null) {
            return 0;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), nextCalibrationDate);
    }
}
