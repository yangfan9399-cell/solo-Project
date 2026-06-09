package com.fire.inspection.entity;

import com.fire.inspection.enums.HazardCategory;
import com.fire.inspection.enums.HazardLevel;
import com.fire.inspection.enums.HazardStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fire_hazard")
public class FireHazard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HazardLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private HazardCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HazardStatus status;

    @Column(length = 50)
    private String building;

    @Column(length = 50)
    private String floor;

    @Column(length = 100)
    private String location;

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_id")
    private User inspector;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_department_head_id")
    private User responsibleDepartmentHead;

    @Column(length = 100)
    private String responsibleDepartment;

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rectified_at")
    private LocalDateTime rectifiedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "is_overdue")
    private Boolean overdue = false;

    @Column(name = "escalated")
    private Boolean escalated = false;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = HazardStatus.REGISTERED;
        }
        if (overdue == null) {
            overdue = false;
        }
        if (escalated == null) {
            escalated = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
