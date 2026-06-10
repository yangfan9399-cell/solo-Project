
package com.example.petshipping.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "quarantine_certificate")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuarantineCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "certificate_number", nullable = false, unique = true)
    private String certificateNumber;
    
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;
    
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    
    @Column(name = "issuing_authority", nullable = false)
    private String issuingAuthority;
    
    @Column(name = "vet_name")
    private String vetName;
    
    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;
    
    @Column(name = "verified_by")
    private String verifiedBy;
    
    @Column(name = "verified_at")
    private LocalDate verifiedAt;
    
    public boolean isExpired() {
        return expiryDate.isBefore(LocalDate.now());
    }
}
