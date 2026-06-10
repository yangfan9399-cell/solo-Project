package com.example.contract.entity;

import com.example.contract.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_no", nullable = false, unique = true)
    private String contractNo;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "contract_type", nullable = false)
    private String contractType;

    @Column(name = "signing_party", nullable = false)
    private String signingParty;

    @Column(name = "signer_name", nullable = false)
    private String signerName;

    @Column(name = "signer_phone", nullable = false)
    private String signerPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus status;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "signing_deadline")
    private LocalDateTime signingDeadline;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @Column(name = "is_frozen")
    private Boolean isFrozen = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

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