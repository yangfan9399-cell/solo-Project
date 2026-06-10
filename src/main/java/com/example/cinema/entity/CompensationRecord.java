
package com.example.cinema.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "compensation_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompensationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interrupt_record_id", nullable = false)
    private InterruptRecord interruptRecord;

    @Column(name = "affected_audience_count", nullable = false)
    private Integer affectedAudienceCount;

    @Column(name = "compensation_amount", nullable = false)
    private BigDecimal compensationAmount;

    @Column(name = "compensation_type")
    private String compensationType;

    @Column(name = "submitter_name", nullable = false)
    private String submitterName;

    @Column(name = "submit_time", nullable = false)
    private LocalDateTime submitTime;

    @Column(name = "reviewer_name")
    private String reviewerName;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    @Column(name = "review_note")
    @Lob
    private String reviewNote;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private CompensationStatus status;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (submitTime == null) {
            submitTime = LocalDateTime.now();
        }
        if (status == null) {
            status = CompensationStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
