package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "claim_case")
public class ClaimCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_no", nullable = false, unique = true, length = 30)
    private String caseNo;

    @Column(name = "policy_id", nullable = false)
    private Long policyId;

    @Column(name = "reporter_name", nullable = false, length = 50)
    private String reporterName;

    @Column(name = "reporter_phone", nullable = false, length = 20)
    private String reporterPhone;

    @Column(name = "accident_date", nullable = false)
    private LocalDate accidentDate;

    @Column(name = "accident_type", nullable = false, length = 50)
    private String accidentType;

    @Column(name = "accident_description", nullable = false, columnDefinition = "TEXT")
    private String accidentDescription;

    @Column(name = "claim_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal claimAmount;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "is_duplicate", nullable = false)
    private Boolean isDuplicate;

    @Column(nullable = false)
    private Boolean frozen;

    @Column(name = "freeze_reason", length = 200)
    private String freezeReason;

    @Column(name = "handler_id")
    private Long handlerId;

    @Column(name = "reviewer_id")
    private Long reviewerId;

    @Column(name = "register_time", nullable = false)
    private LocalDateTime registerTime;

    @Column(name = "last_update_time", nullable = false)
    private LocalDateTime lastUpdateTime;

    @PrePersist
    protected void onCreate() {
        registerTime = LocalDateTime.now();
        lastUpdateTime = LocalDateTime.now();
        if (status == null) status = "REGISTERED";
        if (isDuplicate == null) isDuplicate = false;
        if (frozen == null) frozen = false;
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdateTime = LocalDateTime.now();
    }
}
