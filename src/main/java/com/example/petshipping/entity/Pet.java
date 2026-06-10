
package com.example.petshipping.entity;

import com.example.petshipping.enums.PetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pet")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "pet_type", nullable = false)
    private PetType petType;
    
    @Column(name = "breed")
    private String breed;
    
    @Column(name = "age")
    private Integer age;
    
    @Column(name = "weight", nullable = false)
    private Double weight;
    
    @Column(name = "color")
    private String color;
    
    @Column(name = "microchip_id")
    private String microchipId;
}
