package com.campus.dormrepair.entity;

import com.campus.dormrepair.enums.FaultType;
import com.campus.dormrepair.enums.RepairStatus;
import com.campus.dormrepair.enums.SatisfactionLevel;
import com.campus.dormrepair.enums.TimeoutReason;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_order")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Repair {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 30)
    private String orderNo;

    @Column(nullable = false, length = 20)
    private String building;

    @Column(nullable = false, length = 10)
    private String roomNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FaultType faultType;

    @Column(nullable = false, length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(length = 50)
    private String studentName;

    @Column(length = 20)
    private String studentPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RepairStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dorm_manager_id")
    private User dormManager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repairman_id")
    private User repairman;

    @Column(length = 100)
    private String repairmanName;

    @Column(length = 500)
    private String repairNote;

    @Column(length = 200)
    private String partsUsed;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private TimeoutReason timeoutReason;

    @Column(length = 500)
    private String timeoutDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private SatisfactionLevel satisfaction;

    @Column(length = 500)
    private String reviewComment;

    @Column(nullable = false)
    private LocalDateTime submitTime;

    private LocalDateTime assignTime;

    private LocalDateTime startTime;

    private LocalDateTime completeTime;

    private LocalDateTime reviewTime;

    private LocalDateTime closeTime;

    @Column(name = "repair_duration_minutes")
    private Long repairDurationMinutes;
}
