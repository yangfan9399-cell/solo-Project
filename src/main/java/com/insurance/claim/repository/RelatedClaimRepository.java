package com.insurance.claim.repository;

import com.insurance.claim.entity.RelatedClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RelatedClaimRepository extends JpaRepository<RelatedClaim, Long> {
    @Query("SELECT r FROM RelatedClaim r WHERE r.mainCaseId = :caseId OR r.relatedCaseId = :caseId")
    List<RelatedClaim> findByCaseId(Long caseId);

    List<RelatedClaim> findByMainCaseId(Long mainCaseId);

    List<RelatedClaim> findByRelatedCaseId(Long relatedCaseId);
}
