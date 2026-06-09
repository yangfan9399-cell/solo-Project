package com.bank.due.diligence.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "enterprise")
public class Enterprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String enterpriseCode;

    @Column(nullable = false, length = 200)
    private String enterpriseName;

    @Column(length = 50)
    private String unifiedSocialCreditCode;

    @Column(length = 100)
    private String industry;

    @Column(length = 50)
    private String industryCategory;

    @Column(length = 20)
    private String enterpriseType;

    @Column(precision = 18, scale = 2)
    private BigDecimal registeredCapital;

    @Column(length = 20)
    private String establishmentDate;

    @Column(length = 500)
    private String businessScope;

    @Column(length = 50)
    private String contactPhone;

    @Column(length = 100)
    private String contactEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
