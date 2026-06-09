package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.ApplicationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationHistoryRepository extends JpaRepository<ApplicationHistory, Long> {

    List<ApplicationHistory> findByApplicationIdOrderByCreateTimeAsc(Long applicationId);

    List<ApplicationHistory> findByApplicationIdOrderByCreateTimeDesc(Long applicationId);
}
