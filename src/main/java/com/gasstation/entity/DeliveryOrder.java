package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "delivery_order")
public class DeliveryOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String deliveryNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tank_id", nullable = false)
    private Tank tank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private OilProduct oilProduct;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveryVolume;

    @Column(precision = 10, scale = 2)
    private BigDecimal actualVolume;

    private LocalDate deliveryDate;

    @Column(length = 50)
    private String carrier;

    @Column(length = 200)
    private String remark;
}
