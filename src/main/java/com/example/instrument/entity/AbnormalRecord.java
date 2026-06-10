package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "abnormal_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AbnormalRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "abnormal_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private AbnormalType abnormalType;
    
    @Column(name = "reason", length = 500)
    private String reason;
    
    @Column(name = "handler", length = 50)
    private String handler;
    
    @Column(name = "resolve_status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ResolveStatus resolveStatus;
    
    @Column(name = "resolve_notes", length = 500)
    private String resolveNotes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private InstrumentPackage instrumentPackage;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @Column(name = "resolve_time")
    private LocalDateTime resolveTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        resolveStatus = ResolveStatus.PENDING;
    }
    
    public enum AbnormalType {
        INSTRUMENT_MISSING,
        EXPIRED_STERILIZATION,
        RETURNED_FROM_OPERATING_ROOM,
        DAMAGED_INSTRUMENT,
        OTHER
    }
    
    public enum ResolveStatus {
        PENDING,
        RESOLVED
    }
}