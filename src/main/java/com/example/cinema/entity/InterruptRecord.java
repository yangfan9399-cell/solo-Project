
package com.example.cinema.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "interrupt_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterruptRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screening_id", nullable = false)
    private Screening screening;

    @Column(name = "reporter_name", nullable = false)
    private String reporterName;

    @Column(name = "interrupt_time", nullable = false)
    private LocalDateTime interruptTime;

    @Column(name = "resume_time")
    private LocalDateTime resumeTime;

    @Column(name = "fault_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private FaultType faultType;

    @Column(name = "fault_description")
    @Lob
    private String faultDescription;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Column(name = "resolution_note")
    @Lob
    private String resolutionNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (interruptTime == null) {
            interruptTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
