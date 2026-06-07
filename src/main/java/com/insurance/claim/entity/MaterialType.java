package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "material_type")
public class MaterialType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_code", nullable = false, unique = true, length = 30)
    private String typeCode;

    @Column(name = "type_name", nullable = false, length = 50)
    private String typeName;

    @Column(name = "insurance_type", length = 50)
    private String insuranceType;

    @Column(nullable = false)
    private Boolean required;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @PrePersist
    protected void onCreate() {
        if (required == null) required = true;
        if (sortOrder == null) sortOrder = 0;
    }
}
