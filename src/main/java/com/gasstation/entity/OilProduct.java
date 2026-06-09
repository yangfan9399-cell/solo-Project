package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "oil_product")
public class OilProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String productCode;

    @Column(nullable = false, length = 50)
    private String productName;

    @Column(precision = 10, scale = 3)
    private BigDecimal density;

    @Column(length = 100)
    private String description;
}
