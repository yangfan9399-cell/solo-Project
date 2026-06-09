package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.LegalPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LegalPersonRepository extends JpaRepository<LegalPerson, Long> {

    List<LegalPerson> findByEnterpriseId(Long enterpriseId);

    Optional<LegalPerson> findFirstByEnterpriseId(Long enterpriseId);
}
