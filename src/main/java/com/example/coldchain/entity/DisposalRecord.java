package com.example.coldchain.entity;

import com.example.coldchain.enums.DisposalStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "disposal_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisposalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exception_id", nullable = false)
    private Long exceptionId;

    @Column(name = "waybill_id", nullable = false)
    private Long waybillId;

    @Column(name = "handler_id")
    private Long handlerId;

    @Column(name = "handler_name", length = 50)
    private String handlerName;

    @Column(name = "disposal_method", length = 500)
    private String disposalMethod;

    @Column(name = "disposal_result", length = 500)
    private String disposalResult;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DisposalStatus status;

    @Column(name = "disposal_time")
    private LocalDateTime disposalTime;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}