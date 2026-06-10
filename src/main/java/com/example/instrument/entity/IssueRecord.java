package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "issue_no", unique = true, nullable = false, length = 50)
    private String issueNo;
    
    @Column(name = "department", nullable = false, length = 50)
    private String department;
    
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
}