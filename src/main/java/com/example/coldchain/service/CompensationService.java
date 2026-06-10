package com.example.coldchain.service;

import com.example.coldchain.entity.Compensation;
import com.example.coldchain.enums.CompensationStatus;
import com.example.coldchain.repository.CompensationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompensationService {

    private final CompensationRepository compensationRepository;

    public Optional<Compensation> findByWaybillId(Long waybillId) {
        return compensationRepository.findByWaybillId(waybillId);
    }

    public List<Compensation> findByStatus(CompensationStatus status) {
        return compensationRepository.findByStatus(status);
    }

    public List<Compensation> findPendingAssessments() {
        return compensationRepository.findByStatus(CompensationStatus.PENDING);
    }

    public List<Compensation> findPendingReviews() {
        return compensationRepository.findByStatus(CompensationStatus.ASSESSED);
    }

    @Transactional
    public Compensation createCompensation(Long waybillId, String damageDescription, 
                                          BigDecimal damagePercentage, BigDecimal claimedAmount) {
        Compensation compensation = new Compensation();
        compensation.setWaybillId(waybillId);
        compensation.setStatus(CompensationStatus.PENDING);
        compensation.setDamageDescription(damageDescription);
        compensation.setDamagePercentage(damagePercentage);
        compensation.setClaimedAmount(claimedAmount);
        return compensationRepository.save(compensation);
    }

    @Transactional
    public Compensation assess(Long compensationId, Long assessorId, String assessorName,
                              BigDecimal assessedAmount, String comment) {
        Compensation compensation = compensationRepository.findById(compensationId)
                .orElseThrow(() -> new RuntimeException("赔付记录不存在"));
        compensation.setStatus(CompensationStatus.ASSESSED);
        compensation.setAssessorId(assessorId);
        compensation.setAssessorName(assessorName);
        compensation.setAssessedAmount(assessedAmount);
        compensation.setAssessorComment(comment);
        compensation.setAssessmentTime(LocalDateTime.now());
        return compensationRepository.save(compensation);
    }

    @Transactional
    public Compensation approve(Long compensationId, Long reviewerId, String reviewerName, String comment) {
        Compensation compensation = compensationRepository.findById(compensationId)
                .orElseThrow(() -> new RuntimeException("赔付记录不存在"));
        compensation.setStatus(CompensationStatus.APPROVED);
        compensation.setReviewerId(reviewerId);
        compensation.setReviewerName(reviewerName);
        compensation.setReviewerComment(comment);
        compensation.setReviewTime(LocalDateTime.now());
        return compensationRepository.save(compensation);
    }

    @Transactional
    public Compensation reject(Long compensationId, Long reviewerId, String reviewerName, String comment) {
        Compensation compensation = compensationRepository.findById(compensationId)
                .orElseThrow(() -> new RuntimeException("赔付记录不存在"));
        compensation.setStatus(CompensationStatus.REJECTED);
        compensation.setReviewerId(reviewerId);
        compensation.setReviewerName(reviewerName);
        compensation.setReviewerComment(comment);
        compensation.setReviewTime(LocalDateTime.now());
        return compensationRepository.save(compensation);
    }
}