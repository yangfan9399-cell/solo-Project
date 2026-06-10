
package com.example.petshipping.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "crate")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Crate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "length", nullable = false)
    private Double length;
    
    @Column(name = "width", nullable = false)
    private Double width;
    
    @Column(name = "height", nullable = false)
    private Double height;
    
    @Column(name = "material")
    private String material;
    
    @Column(name = "has_ventilation")
    @Builder.Default
    private Boolean hasVentilation = true;
    
    @Column(name = "has_drip_tray")
    @Builder.Default
    private Boolean hasDripTray = false;
    
    @Column(name = "is_approved")
    @Builder.Default
    private Boolean isApproved = false;
    
    @Column(name = "checked_by")
    private String checkedBy;
    
    @Column(name = "check_notes")
    private String checkNotes;
    
    public boolean isCompliant(Double petWeight) {
        double requiredVolume = petWeight * 3000;
        double actualVolume = length * width * height;
        return actualVolume >= requiredVolume && hasVentilation && hasDripTray;
    }
}
