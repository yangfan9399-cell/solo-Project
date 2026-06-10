package com.example.contract.repository;

import com.example.contract.entity.Contract;
import com.example.contract.enums.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByStatus(ContractStatus status);
    List<Contract> findByOperatorId(Long operatorId);
    List<Contract> findByContractType(String contractType);
    List<Contract> findByStatusIn(List<ContractStatus> statuses);
    
    @Query("SELECT c FROM Contract c WHERE c.operatorId IN (SELECT u.id FROM User u WHERE u.department = :department)")
    List<Contract> findByDepartment(@Param("department") String department);
    
    @Query("SELECT c FROM Contract c WHERE c.createdAt BETWEEN :startTime AND :endTime")
    List<Contract> findByCreatedBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    Optional<Contract> findByContractNo(String contractNo);
    
    @Query("SELECT c FROM Contract c WHERE c.status = 'FAILED' ORDER BY c.createdAt DESC")
    List<Contract> findFailedContracts();
}