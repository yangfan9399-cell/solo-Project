package com.fire.inspection.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rectification")
public class Rectification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_id", nullable = false)
    private FireHazard hazard;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "rectification_photo_url", length = 255)
    private String rectificationPhotoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rectifier_id")
    private User rectifier;

    @Column(name = "rectified_at")
    private LocalDateTime rectifiedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
