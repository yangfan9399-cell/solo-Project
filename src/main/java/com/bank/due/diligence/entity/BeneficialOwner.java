package com.bank.due.diligence.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "beneficial_owner")
public class BeneficialOwner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 30)
    private String idType;

    @Column(length = 30)
    private String idNumber;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String address;

    @Column(precision = 5, scale = 2)
    private BigDecimal shareholdingRatio;

    @Column(length = 50)
    private String relationship;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
