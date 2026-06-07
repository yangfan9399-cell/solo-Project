package com.insurance.claim.repository;

import com.insurance.claim.entity.ClaimCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ClaimCaseRepository extends JpaRepository<ClaimCase, Long> {
    Optional<ClaimCase> findByCaseNo(String caseNo);

    List<ClaimCase> findByStatusOrderByRegisterTimeDesc(String status);

    List<ClaimCase> findByPolicyIdOrderByRegisterTimeDesc(Long policyId);

    @Query("SELECT c FROM ClaimCase c WHERE c.status IN :statuses ORDER BY c.registerTime DESC")
    List<ClaimCase> findByStatusIn(List<String> statuses);

    @Query("SELECT c FROM ClaimCase c WHERE c.policyId = :policyId AND c.accidentDate = :accidentDate AND c.id != :excludeId")
    List<ClaimCase> findPotentialDuplicates(Long policyId, LocalDate accidentDate, Long excludeId);

    @Query("SELECT c FROM ClaimCase c WHERE c.accidentDate BETWEEN :startDate AND :endDate ORDER BY c.registerTime DESC")
    List<ClaimCase> findByAccidentDateBetween(LocalDate startDate, LocalDate endDate);

    long countByStatus(String status);
}
