package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "instrument")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Instrument {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "instrument_code", nullable = false, length = 50)
    private String instrumentCode;
    
    @Column(name = "instrument_name", nullable = false, length = 100)
    private String instrumentName;
    
    @Column(name = "instrument_type", nullable = false, length = 50)
    private String instrumentType;
    
    @Column(name = "specification", length = 100)
    private String specification;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "unit", length = 20)
    private String unit;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private InstrumentPackage instrumentPackage;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}