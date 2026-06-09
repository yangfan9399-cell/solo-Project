package com.bank.due.diligence.entity;

import com.bank.due.diligence.enums.MaterialStatus;
import com.bank.due.diligence.enums.MaterialType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "material")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private AccountApplication application;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private MaterialType materialType;

    @Column(length = 200)
    private String materialName;

    @Column(length = 500)
    private String fileUrl;

    @Column(length = 200)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MaterialStatus status;

    @Column(length = 500)
    private String deficiencyReason;

    @Column(length = 20)
    private String submitTime;

    @Column(length = 50)
    private String submitter;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
