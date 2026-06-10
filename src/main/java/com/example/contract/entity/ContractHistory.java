package com.example.contract.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @Column(name = "operator_name", nullable = false)
    private String operatorName;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}