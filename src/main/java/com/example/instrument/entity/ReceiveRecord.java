package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "receive_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiveRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "receive_no", unique = true, nullable = false, length = 50)
    private String receiveNo;
    
    @Column(name = "department", nullable = false, length = 50)
    private String department;
    
    @Column(name = "result", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ReceiveResult result;
    
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
    
    public enum ReceiveResult {
        ACCEPTED,
        REJECTED
    }
}