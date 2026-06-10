package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sterilization_batch")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SterilizationBatch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "batch_no", unique = true, nullable = false, length = 50)
    private String batchNo;
    
    @Column(name = "sterilizer_no", length = 50)
    private String sterilizerNo;
    
    @Column(name = "sterilization_date", nullable = false)
    private LocalDate sterilizationDate;
    
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    
    @Column(name = "operator", nullable = false, length = 50)
    private String operator;
    
    @Column(name = "notes", length = 500)
    private String notes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private InstrumentPackage instrumentPackage;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
    }
    
    public boolean isExpired() {
        return expiryDate != null && expiryDate.isBefore(LocalDate.now());
    }
}