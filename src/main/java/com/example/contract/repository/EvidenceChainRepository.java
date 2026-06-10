package com.example.contract.repository;

import com.example.contract.entity.EvidenceChain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceChainRepository extends JpaRepository<EvidenceChain, Long> {
    List<EvidenceChain> findByContractId(Long contractId);
    List<EvidenceChain> findByContractIdOrderByCreatedAtDesc(Long contractId);
    List<EvidenceChain> findByEvidenceType(String evidenceType);
}