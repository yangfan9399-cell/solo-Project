
package com.example.cinema.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InspectionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screening_id", nullable = false)
    private Screening screening;

    @Column(name = "inspector_name", nullable = false)
    private String inspectorName;

    @Column(name = "inspection_time", nullable = false)
    private LocalDateTime inspectionTime;

    @Column(name = "projector_status")
    @Enumerated(EnumType.STRING)
    private EquipmentStatus projectorStatus;

    @Column(name = "audio_status")
    @Enumerated(EnumType.STRING)
    private EquipmentStatus audioStatus;

    @Column(name = "lighting_status")
    @Enumerated(EnumType.STRING)
    private EquipmentStatus lightingStatus;

    @Column(name = "air_conditioning_status")
    @Enumerated(EnumType.STRING)
    private EquipmentStatus airConditioningStatus;

    @Column(name = "seating_status")
    @Enumerated(EnumType.STRING)
    private EquipmentStatus seatingStatus;

    @Column(name = "remarks")
    @Lob
    private String remarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (inspectionTime == null) {
            inspectionTime = LocalDateTime.now();
        }
    }
}
