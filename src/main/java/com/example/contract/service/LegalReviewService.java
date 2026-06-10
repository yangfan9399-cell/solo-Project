package com.example.contract.service;

import com.example.contract.entity.Contract;
import com.example.contract.entity.ContractHistory;
import com.example.contract.entity.LegalReview;
import com.example.contract.repository.ContractHistoryRepository;
import com.example.contract.repository.ContractRepository;
import com.example.contract.repository.LegalReviewRepository;
import com.example.contract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LegalReviewService {

    private final LegalReviewRepository legalReviewRepository;
    private final ContractRepository contractRepository;
    private final ContractHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public LegalReview createReview(Long contractId, Long reviewerId) {
        LegalReview review = new LegalReview();
        review.setContractId(contractId);
        review.setReviewerId(reviewerId);
        review.setReviewStatus("PENDING");
        LegalReview saved = legalReviewRepository.save(review);

        userRepository.findById(reviewerId).ifPresent(reviewer -> {
            addHistory(contractId, reviewerId, reviewer.getRealName(), "REVIEW_INIT", "法务复核已发起");
        });

        return saved;
    }

    @Transactional
    public LegalReview completeReview(Long reviewId, String status, String comment) {
        LegalReview review = legalReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("复核记录不存在"));

        review.setReviewStatus(status);
        review.setReviewComment(comment);
        review.setReviewedAt(LocalDateTime.now());
        LegalReview saved = legalReviewRepository.save(review);

        userRepository.findById(review.getReviewerId()).ifPresent(reviewer -> {
            String action = "REVIEW_APPROVE".equals(status) ? "REVIEW_APPROVE" : "REVIEW_REJECT";
            String desc = "REVIEW_APPROVE".equals(status) ? "法务复核通过" : "法务复核拒绝: " + comment;
            addHistory(review.getContractId(), review.getReviewerId(), reviewer.getRealName(), action, desc);
        });

        return saved;
    }

    public List<LegalReview> getReviewsByStatus(String status) {
        return legalReviewRepository.findByReviewStatus(status);
    }

    public LegalReview getReviewByContractId(Long contractId) {
        return legalReviewRepository.findByContractId(contractId).orElse(null);
    }

    private void addHistory(Long contractId, Long operatorId, String operatorName, String action, String description) {
        ContractHistory history = new ContractHistory();
        history.setContractId(contractId);
        history.setOperatorId(operatorId);
        history.setOperatorName(operatorName);
        history.setAction(action);
        history.setDescription(description);
        historyRepository.save(history);
    }
}