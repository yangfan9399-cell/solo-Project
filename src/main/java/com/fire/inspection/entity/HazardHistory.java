package com.fire.inspection.entity;

import com.fire.inspection.enums.HazardStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "hazard_history")
public class HazardHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_id", nullable = false)
    private FireHazard hazard;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private HazardStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private HazardStatus toStatus;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
