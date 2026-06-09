package com.bank.due.diligence.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "business_address")
public class BusinessAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @Column(length = 50)
    private String addressType;

    @Column(nullable = false, length = 200)
    private String province;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String district;

    @Column(length = 300)
    private String detailAddress;

    @Column(length = 20)
    private String zipCode;

    @Column(length = 20)
    private String phone;

    private Boolean isVerified = false;

    @Column(length = 200)
    private String verificationResult;

    @Column(length = 50)
    private String verifier;

    private LocalDateTime verifyTime;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
