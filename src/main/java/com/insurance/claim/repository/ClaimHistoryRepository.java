package com.insurance.claim.repository;

import com.insurance.claim.entity.ClaimHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClaimHistoryRepository extends JpaRepository<ClaimHistory, Long> {
    List<ClaimHistory> findByClaimCaseIdOrderByOperationTimeAsc(Long claimCaseId);
}
