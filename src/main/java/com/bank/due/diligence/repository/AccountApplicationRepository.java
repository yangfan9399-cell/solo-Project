package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.AccountApplication;
import com.bank.due.diligence.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccountApplicationRepository extends JpaRepository<AccountApplication, Long> {

    AccountApplication findByApplicationNo(String applicationNo);

    List<AccountApplication> findByStatus(ApplicationStatus status);

    List<AccountApplication> findByBranchId(Long branchId);

    List<AccountApplication> findByEnterpriseId(Long enterpriseId);

    List<AccountApplication> findByStatusIn(List<ApplicationStatus> statuses);

    @Query("SELECT a FROM AccountApplication a WHERE a.branch.id = :branchId AND a.status IN :statuses")
    List<AccountApplication> findByBranchIdAndStatusIn(@Param("branchId") Long branchId, @Param("statuses") List<ApplicationStatus> statuses);

    @Query("SELECT a FROM AccountApplication a WHERE a.createTime BETWEEN :startTime AND :endTime")
    List<AccountApplication> findByCreateTimeBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Query("SELECT a.branch.branchName, COUNT(a) FROM AccountApplication a GROUP BY a.branch.id, a.branch.branchName")
    List<Object[]> countByBranch();

    @Query("SELECT a.enterprise.industry, COUNT(a) FROM AccountApplication a WHERE a.enterprise.industry IS NOT NULL GROUP BY a.enterprise.industry")
    List<Object[]> countByIndustry();

    @Query("SELECT a.status, COUNT(a) FROM AccountApplication a GROUP BY a.status")
    List<Object[]> countByStatus();
}
