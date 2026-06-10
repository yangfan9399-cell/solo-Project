package com.example.coldchain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "temperature_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemperatureRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "waybill_id", nullable = false)
    private Long waybillId;

    @Column(name = "temperature", nullable = false)
    private BigDecimal temperature;

    @Column(name = "humidity")
    private BigDecimal humidity;

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime;

    @Column(name = "is_exception")
    private Boolean isException = false;

    @Column(name = "sensor_id", length = 50)
    private String sensorId;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}