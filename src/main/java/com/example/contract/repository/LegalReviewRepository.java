package com.example.contract.repository;

import com.example.contract.entity.LegalReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LegalReviewRepository extends JpaRepository<LegalReview, Long> {
    Optional<LegalReview> findByContractId(Long contractId);
    List<LegalReview> findByReviewerId(Long reviewerId);
    List<LegalReview> findByReviewStatus(String reviewStatus);
}