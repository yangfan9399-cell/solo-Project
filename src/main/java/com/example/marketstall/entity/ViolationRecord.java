package com.example.marketstall.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "violation_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ViolationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stall_id", nullable = false)
    private Long stallId;

    @Column(name = "violation_type", nullable = false)
    private String violationType;

    @Column(name = "description")
    private String description;

    @Column(name = "points_deducted")
    private Integer pointsDeducted;

    @Column(name = "record_date")
    private LocalDate recordDate;

    @Column(name = "status")
    private String status;

    @Column(name = "inspector")
    private String inspector;

    @Column(name = "supervisor_remark")
    private String supervisorRemark;

    @Column(name = "rectified_at")
    private LocalDate rectifiedAt;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        recordDate = LocalDate.now();
        if (status == null) {
            status = "pending";
        }
        if (pointsDeducted == null) {
            pointsDeducted = 0;
        }
    }
}