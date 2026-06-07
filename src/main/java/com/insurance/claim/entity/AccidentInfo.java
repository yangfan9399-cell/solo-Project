package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "accident_info")
public class AccidentInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_case_id", nullable = false)
    private Long claimCaseId;

    @Column(name = "accident_location", length = 200)
    private String accidentLocation;

    @Column(name = "injury_description", columnDefinition = "TEXT")
    private String injuryDescription;

    @Column(name = "diagnosis_result", columnDefinition = "TEXT")
    private String diagnosisResult;

    @Column(name = "hospital_name", length = 100)
    private String hospitalName;

    @Column(name = "treatment_cost", precision = 15, scale = 2)
    private BigDecimal treatmentCost;

    @Column(name = "property_loss", precision = 15, scale = 2)
    private BigDecimal propertyLoss;

    @Column(name = "other_info", columnDefinition = "TEXT")
    private String otherInfo;
}
