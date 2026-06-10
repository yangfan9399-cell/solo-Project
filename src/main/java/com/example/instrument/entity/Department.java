package com.example.instrument.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "department")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "dept_code", unique = true, nullable = false, length = 50)
    private String deptCode;
    
    @Column(name = "dept_name", nullable = false, length = 100)
    private String deptName;
    
    @Column(name = "dept_type", length = 20)
    @Enumerated(EnumType.STRING)
    private DeptType deptType;
    
    @Column(name = "status", nullable = false)
    private Boolean status;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @Column(name = "update_time")
    private LocalDateTime updateTime;
    
    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        status = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
    
    public enum DeptType {
        OPERATING_ROOM,
        SUPPLY_ROOM,
        WARD,
        OTHER
    }
}