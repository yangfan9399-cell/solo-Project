package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "tank")
public class Tank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String tankCode;

    @Column(nullable = false, length = 50)
    private String tankName;

    @Column(precision = 10, scale = 2)
    private BigDecimal capacity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private OilProduct oilProduct;

    private Boolean gaugeStatus;

    @Column(length = 200)
    private String remark;
}
