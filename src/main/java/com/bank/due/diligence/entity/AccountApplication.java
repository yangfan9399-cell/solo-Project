package com.bank.due.diligence.entity;

import com.bank.due.diligence.enums.ApplicationStatus;
import com.bank.due.diligence.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "account_application")
public class AccountApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String applicationNo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ApplicationStatus status;

    @Column(length = 50)
    private String accountType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RiskLevel riskLevel;

    @Column(length = 200)
    private String riskComment;

    @Column(length = 200)
    private String returnReason;

    @Column(length = 200)
    private String rejectReason;

    @Column(length = 50)
    private String customerManagerName;

    @Column(length = 20)
    private String customerManagerPhone;

    @Column(length = 50)
    private String operationStaffName;

    @Column(length = 50)
    private String riskControlName;

    @Column(length = 50)
    private String supervisorName;

    private LocalDateTime submitTime;

    private LocalDateTime operationVerifyTime;

    private LocalDateTime riskReviewTime;

    private LocalDateTime approvalTime;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
