package com.insurance.claim.repository;

import com.insurance.claim.entity.ClaimMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClaimMaterialRepository extends JpaRepository<ClaimMaterial, Long> {
    List<ClaimMaterial> findByClaimCaseIdOrderByUploadTimeDesc(Long claimCaseId);

    List<ClaimMaterial> findByClaimCaseIdAndStatus(Long claimCaseId, String status);

    Optional<ClaimMaterial> findFirstByClaimCaseIdAndMaterialTypeIdAndStatus(Long claimCaseId, Long materialTypeId, String status);

    boolean existsByClaimCaseIdAndMaterialTypeIdAndStatus(Long claimCaseId, Long materialTypeId, String status);
}
