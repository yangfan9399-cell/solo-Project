package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "claim_review")
public class ClaimReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_case_id", nullable = false)
    private Long claimCaseId;

    @Column(name = "reviewer_id")
    private Long reviewerId;

    @Column(name = "review_result", nullable = false, length = 30)
    private String reviewResult;

    @Column(name = "liability_judgment", columnDefinition = "TEXT")
    private String liabilityJudgment;

    @Column(name = "reject_reason", length = 200)
    private String rejectReason;

    @Column(name = "approved_amount", precision = 15, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "review_remark", columnDefinition = "TEXT")
    private String reviewRemark;

    @Column(name = "review_time", nullable = false)
    private LocalDateTime reviewTime;

    @PrePersist
    protected void onCreate() {
        reviewTime = LocalDateTime.now();
    }
}
