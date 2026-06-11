package com.campus.dormrepair.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "repair_part")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_id", nullable = false)
    private Repair repair;

    @Column(nullable = false, length = 100)
    private String partName;

    private Integer quantity;

    @Column(length = 100)
    private String unit;
}
