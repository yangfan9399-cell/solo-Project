package com.insurance.claim.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "claim_material")
public class ClaimMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_case_id", nullable = false)
    private Long claimCaseId;

    @Column(name = "material_type_id", nullable = false)
    private Long materialTypeId;

    @Column(name = "material_name", nullable = false, length = 100)
    private String materialName;

    @Column(name = "file_path", length = 200)
    private String filePath;

    @Column(name = "file_name", length = 100)
    private String fileName;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "review_remark", length = 200)
    private String reviewRemark;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "upload_time", nullable = false)
    private LocalDateTime uploadTime;

    @PrePersist
    protected void onCreate() {
        uploadTime = LocalDateTime.now();
        if (status == null) status = "SUBMITTED";
    }
}
