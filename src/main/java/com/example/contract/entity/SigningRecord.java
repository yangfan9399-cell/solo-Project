package com.example.contract.entity;

import com.example.contract.enums.AuthMethod;
import com.example.contract.enums.FailureReason;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "signing_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SigningRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "signer_id", nullable = false)
    private Long signerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_method", nullable = false)
    private AuthMethod authMethod;

    @Column(name = "auth_success")
    private Boolean authSuccess;

    @Enumerated(EnumType.STRING)
    @Column(name = "failure_reason")
    private FailureReason failureReason;

    @Column(name = "failure_detail")
    private String failureDetail;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "signing_time")
    private LocalDateTime signingTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}