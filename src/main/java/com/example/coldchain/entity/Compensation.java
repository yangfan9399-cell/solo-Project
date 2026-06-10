package com.example.coldchain.entity;

import com.example.coldchain.enums.CompensationStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "compensation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Compensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "waybill_id", nullable = false)
    private Long waybillId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CompensationStatus status;

    @Column(name = "damage_description", length = 500)
    private String damageDescription;

    @Column(name = "damage_percentage")
    private BigDecimal damagePercentage;

    @Column(name = "claimed_amount", precision = 12, scale = 2)
    private BigDecimal claimedAmount;

    @Column(name = "assessed_amount", precision = 12, scale = 2)
    private BigDecimal assessedAmount;

    @Column(name = "assessor_id")
    private Long assessorId;

    @Column(name = "assessor_name", length = 50)
    private String assessorName;

    @Column(name = "assessment_time")
    private LocalDateTime assessmentTime;

    @Column(name = "assessor_comment", length = 500)
    private String assessorComment;

    @Column(name = "reviewer_id")
    private Long reviewerId;

    @Column(name = "reviewer_name", length = 50)
    private String reviewerName;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    @Column(name = "reviewer_comment", length = 500)
    private String reviewerComment;

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