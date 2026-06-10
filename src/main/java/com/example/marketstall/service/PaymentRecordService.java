package com.example.marketstall.service;

import com.example.marketstall.entity.PaymentRecord;
import com.example.marketstall.repository.PaymentRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentRecordService {

    private final PaymentRecordRepository paymentRecordRepository;

    public List<PaymentRecord> getAllPaymentRecords() {
        return paymentRecordRepository.findAll();
    }

    public PaymentRecord getPaymentRecordById(Long id) {
        return paymentRecordRepository.findById(id).orElse(null);
    }

    public List<PaymentRecord> getPaymentRecordsByStallId(Long stallId) {
        return paymentRecordRepository.findByStallId(stallId);
    }

    public PaymentRecord savePaymentRecord(PaymentRecord record) {
        return paymentRecordRepository.save(record);
    }

    public void deletePaymentRecord(Long id) {
        paymentRecordRepository.deleteById(id);
    }

    public void confirmPayment(Long id, String operator) {
        PaymentRecord record = paymentRecordRepository.findById(id).orElse(null);
        if (record != null) {
            record.setStatus("confirmed");
            record.setOperator(operator);
            record.setPaymentDate(LocalDate.now());
            paymentRecordRepository.save(record);
        }
    }

    public List<PaymentRecord> getPendingPayments() {
        return paymentRecordRepository.findByStatus("pending");
    }

    public Map<Long, BigDecimal> getTotalPaymentsByStall() {
        return paymentRecordRepository.sumAmountByStallId().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (BigDecimal) row[1]
                ));
    }

    public Map<String, Long> countByPaymentMethod() {
        return paymentRecordRepository.countByPaymentMethod().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    public Map<String, Long> countOverdueDaysDistribution() {
        List<PaymentRecord> pendingPayments = paymentRecordRepository.findByStatus("pending");
        LocalDate today = LocalDate.now();
        
        return pendingPayments.stream()
                .filter(p -> p.getDueDate() != null)
                .collect(Collectors.groupingBy(
                        p -> {
                            long days = java.time.temporal.ChronoUnit.DAYS.between(p.getDueDate(), today);
                            if (days <= 7) return "0-7天";
                            else if (days <= 14) return "8-14天";
                            else if (days <= 30) return "15-30天";
                            else return "30天以上";
                        },
                        Collectors.counting()
                ));
    }
}