package com.insurance.claim.repository;

import com.insurance.claim.entity.ClaimReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClaimReviewRepository extends JpaRepository<ClaimReview, Long> {
    List<ClaimReview> findByClaimCaseIdOrderByReviewTimeDesc(Long claimCaseId);

    Optional<ClaimReview> findFirstByClaimCaseIdOrderByReviewTimeDesc(Long claimCaseId);
}
