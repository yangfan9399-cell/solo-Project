package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "claim_history")
public class ClaimHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_case_id", nullable = false)
    private Long claimCaseId;

    @Column(name = "operation_type", nullable = false, length = 30)
    private String operationType;

    @Column(name = "operator_id")
    private Long operatorId;

    @Column(name = "operator_name", length = 50)
    private String operatorName;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "operation_time", nullable = false)
    private LocalDateTime operationTime;

    @PrePersist
    protected void onCreate() {
        operationTime = LocalDateTime.now();
    }
}
