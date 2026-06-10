
package com.example.petshipping.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "flight")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "flight_number", nullable = false, unique = true)
    private String flightNumber;
    
    @Column(name = "departure_city", nullable = false)
    private String departureCity;
    
    @Column(name = "arrival_city", nullable = false)
    private String arrivalCity;
    
    @Column(name = "departure_time", nullable = false)
    private LocalDateTime departureTime;
    
    @Column(name = "arrival_time", nullable = false)
    private LocalDateTime arrivalTime;
    
    @Column(name = "airline", nullable = false)
    private String airline;
    
    @Column(name = "pet_capacity", nullable = false)
    private Integer petCapacity;
    
    @Column(name = "current_pet_count")
    @Builder.Default
    private Integer currentPetCount = 0;
}
