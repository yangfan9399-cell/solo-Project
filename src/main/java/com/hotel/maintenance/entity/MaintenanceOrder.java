package com.hotel.maintenance.entity;

import com.hotel.maintenance.enums.FaultType;
import com.hotel.maintenance.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "maintenance_orders")
public class MaintenanceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FaultType faultType;

    @Column(nullable = false, length = 1000)
    private String faultDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Employee reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engineer_id")
    private Employee engineer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "housekeeper_id")
    private Employee housekeeper;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private Employee reviewer;

    @Column(length = 2000)
    private String repairReport;

    @Column(length = 2000)
    private String cleaningReport;

    @Column(length = 2000)
    private String reviewComment;

    private LocalDateTime estimatedRepairTime;

    private LocalDateTime actualRepairStartTime;

    private LocalDateTime actualRepairEndTime;

    private LocalDateTime cleaningCheckTime;

    private LocalDateTime reviewTime;

    private LocalDateTime restoreTime;

    @Column(nullable = false)
    private LocalDateTime outOfServiceTime;

    private Integer priority;

    private Boolean complaint = false;

    @Column(length = 2000)
    private String complaintDescription;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
