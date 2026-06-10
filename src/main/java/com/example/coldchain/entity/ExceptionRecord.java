package com.example.coldchain.entity;

import com.example.coldchain.enums.ExceptionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "exception_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExceptionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "waybill_id", nullable = false)
    private Long waybillId;

    @Enumerated(EnumType.STRING)
    @Column(name = "exception_type", nullable = false, length = 30)
    private ExceptionType exceptionType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "exception_time", nullable = false)
    private LocalDateTime exceptionTime;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "is_disposed")
    private Boolean isDisposed = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}