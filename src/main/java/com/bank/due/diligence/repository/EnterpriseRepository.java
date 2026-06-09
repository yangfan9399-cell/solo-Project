package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnterpriseRepository extends JpaRepository<Enterprise, Long> {

    Optional<Enterprise> findByEnterpriseCode(String enterpriseCode);

    Optional<Enterprise> findByUnifiedSocialCreditCode(String unifiedSocialCreditCode);
}
