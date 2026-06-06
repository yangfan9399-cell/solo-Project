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
@Table(name = "borrow_records")
public class BorrowRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fixture_id", nullable = false)
    private Fixture fixture;

    @Column(nullable = false, length = 50)
    private String applicant;

    @Column(nullable = false, length = 50)
    private String productionLine;

    @Column(length = 200)
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BorrowStatus status;

    private LocalDateTime borrowDate;

    private LocalDate expectedReturnDate;

    private LocalDateTime actualReturnDate;

    @Column(length = 50)
    private String adminConfirmer;

    @Column(length = 50)
    private String qualityReviewer;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private QualityResult qualityResult;

    @Column(columnDefinition = "TEXT")
    private String qualityRemark;

    @Column(columnDefinition = "TEXT")
    private String damageDescription;

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

    public boolean isOverdue() {
        if (expectedReturnDate == null || status == BorrowStatus.RETURNED_NORMAL || status == BorrowStatus.RETURNED_DAMAGED) {
            return false;
        }
        return LocalDate.now().isAfter(expectedReturnDate);
    }

    public long getOverdueDays() {
        if (expectedReturnDate == null || !isOverdue()) {
            return 0;
        }
        return ChronoUnit.DAYS.between(expectedReturnDate, LocalDate.now());
    }

    public long getDaysUntilDue() {
        if (expectedReturnDate == null) {
            return 0;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), expectedReturnDate);
    }
}
