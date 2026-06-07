package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "related_claim")
public class RelatedClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "main_case_id", nullable = false)
    private Long mainCaseId;

    @Column(name = "related_case_id", nullable = false)
    private Long relatedCaseId;

    @Column(name = "relation_type", nullable = false, length = 30)
    private String relationType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (relationType == null) relationType = "DUPLICATE";
    }
}
