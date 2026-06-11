package com.campus.dormrepair.entity;

import com.campus.dormrepair.enums.RepairStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_id", nullable = false)
    private Repair repair;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RepairStatus status;

    @Column(length = 50)
    private String operatorName;

    @Column(length = 500)
    private String remark;

    @Column(nullable = false)
    private LocalDateTime operateTime;
}
