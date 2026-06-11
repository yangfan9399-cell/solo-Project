package com.hotel.maintenance.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "affected_orders")
public class AffectedOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_order_id", nullable = false)
    private MaintenanceOrder maintenanceOrder;

    private String guestName;

    private String guestPhone;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Double orderAmount;

    private String handlingMethod;

    private Double compensationAmount;

    @Column(length = 500)
    private String remark;
}
