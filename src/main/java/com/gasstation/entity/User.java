package com.gasstation.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "sys_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 50)
    private String realName;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private Station station;

    @Column(length = 20)
    private String phone;
}
