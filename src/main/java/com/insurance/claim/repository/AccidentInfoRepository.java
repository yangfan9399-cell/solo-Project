package com.insurance.claim.repository;

import com.insurance.claim.entity.AccidentInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccidentInfoRepository extends JpaRepository<AccidentInfo, Long> {
    Optional<AccidentInfo> findByClaimCaseId(Long claimCaseId);
}
