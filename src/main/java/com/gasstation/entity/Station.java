package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "station")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String stationCode;

    @Column(nullable = false, length = 100)
    private String stationName;

    @Column(length = 200)
    private String address;

    @Column(length = 20)
    private String phone;
}
