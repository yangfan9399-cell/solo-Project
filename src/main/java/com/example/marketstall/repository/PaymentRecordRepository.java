package com.example.marketstall.repository;

import com.example.marketstall.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
    List<PaymentRecord> findByStallId(Long stallId);
    List<PaymentRecord> findByStatus(String status);
    List<PaymentRecord> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT pr.stallId, SUM(pr.amount) FROM PaymentRecord pr WHERE pr.status = 'confirmed' GROUP BY pr.stallId")
    List<Object[]> sumAmountByStallId();
    
    @Query("SELECT pr.paymentMethod, COUNT(pr) FROM PaymentRecord pr GROUP BY pr.paymentMethod")
    List<Object[]> countByPaymentMethod();
}