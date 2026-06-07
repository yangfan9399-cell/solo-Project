package com.insurance.claim.service;

import com.insurance.claim.entity.*;
import com.insurance.claim.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ClaimReviewRepository reviewRepository;
    private final ClaimCaseRepository claimCaseRepository;
    private final ClaimCaseService claimCaseService;

    @Transactional
    public ClaimReview approveClaim(Long caseId, Long reviewerId, String reviewerName,
                                     String liabilityJudgment, BigDecimal approvedAmount, String remark) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        if (claimCase.getFrozen()) {
            throw new RuntimeException("案件已冻结，无法核赔");
        }

        ClaimReview review = new ClaimReview();
        review.setClaimCaseId(caseId);
        review.setReviewerId(reviewerId);
        review.setReviewResult("APPROVED");
        review.setLiabilityJudgment(liabilityJudgment);
        review.setApprovedAmount(approvedAmount);
        review.setReviewRemark(remark);
        reviewRepository.save(review);

        claimCase.setStatus("APPROVED");
        claimCase.setReviewerId(reviewerId);
        claimCaseRepository.save(claimCase);

        claimCaseService.addHistory(caseId, "APPROVE", reviewerId, reviewerName,
                "核赔通过，赔付金额：" + approvedAmount + "元");

        return review;
    }

    @Transactional
    public ClaimReview rejectClaim(Long caseId, Long reviewerId, String reviewerName,
                                    String rejectReason, String liabilityJudgment, String remark) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        if (claimCase.getFrozen()) {
            throw new RuntimeException("案件已冻结，无法核赔");
        }

        ClaimReview review = new ClaimReview();
        review.setClaimCaseId(caseId);
        review.setReviewerId(reviewerId);
        review.setReviewResult("REJECTED");
        review.setLiabilityJudgment(liabilityJudgment);
        review.setRejectReason(rejectReason);
        review.setReviewRemark(remark);
        reviewRepository.save(review);

        claimCase.setStatus("REJECTED");
        claimCase.setReviewerId(reviewerId);
        claimCaseRepository.save(claimCase);

        claimCaseService.addHistory(caseId, "REJECT", reviewerId, reviewerName,
                "拒赔，原因：" + rejectReason);

        return review;
    }

    @Transactional
    public ClaimReview returnCase(Long caseId, Long reviewerId, String reviewerName,
                                   String returnReason, String remark) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        if (claimCase.getFrozen()) {
            throw new RuntimeException("案件已冻结，无法退回");
        }

        ClaimReview review = new ClaimReview();
        review.setClaimCaseId(caseId);
        review.setReviewerId(reviewerId);
        review.setReviewResult("RETURNED");
        review.setRejectReason(returnReason);
        review.setReviewRemark(remark);
        reviewRepository.save(review);

        claimCase.setStatus("RETURNED");
        claimCase.setReviewerId(reviewerId);
        claimCaseRepository.save(claimCase);

        claimCaseService.addHistory(caseId, "RETURN", reviewerId, reviewerName,
                "退回案件，原因：" + returnReason);

        return review;
    }

    public ClaimReview getLatestReview(Long caseId) {
        return reviewRepository.findFirstByClaimCaseIdOrderByReviewTimeDesc(caseId).orElse(null);
    }

    public List<ClaimReview> getReviewHistory(Long caseId) {
        return reviewRepository.findByClaimCaseIdOrderByReviewTimeDesc(caseId);
    }
}
