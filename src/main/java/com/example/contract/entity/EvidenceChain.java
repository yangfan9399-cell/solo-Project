package com.example.contract.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "evidence_chains")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceChain {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "record_id")
    private Long recordId;

    @Column(name = "evidence_type", nullable = false)
    private String evidenceType;

    @Column(name = "evidence_content", columnDefinition = "TEXT")
    private String evidenceContent;

    @Column(name = "hash_value", nullable = false, unique = true)
    private String hashValue;

    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}