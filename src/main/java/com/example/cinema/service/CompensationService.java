
package com.example.cinema.service;

import com.example.cinema.entity.*;
import com.example.cinema.repository.CompensationRecordRepository;
import com.example.cinema.repository.InterruptRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompensationService {

    @Autowired
    private CompensationRecordRepository compensationRecordRepository;

    @Autowired
    private InterruptRecordRepository interruptRecordRepository;

    @Transactional
    public CompensationRecord submitCompensation(Long interruptId, Integer affectedAudienceCount,
            BigDecimal compensationAmount, String compensationType, String submitterName) {
        
        InterruptRecord interruptRecord = interruptRecordRepository.findById(interruptId)
                .orElseThrow(() -> new RuntimeException("中断记录不存在"));
        
        CompensationRecord record = new CompensationRecord();
        record.setInterruptRecord(interruptRecord);
        record.setAffectedAudienceCount(affectedAudienceCount);
        record.setCompensationAmount(compensationAmount);
        record.setCompensationType(compensationType);
        record.setSubmitterName(submitterName);
        record.setSubmitTime(LocalDateTime.now());
        record.setStatus(CompensationStatus.PENDING);
        
        return compensationRecordRepository.save(record);
    }

    @Transactional
    public CompensationRecord reviewCompensation(Long compensationId, String reviewerName,
            CompensationStatus status, String reviewNote) {
        
        CompensationRecord record = compensationRecordRepository.findById(compensationId)
                .orElseThrow(() -> new RuntimeException("补偿记录不存在"));
        
        record.setReviewerName(reviewerName);
        record.setReviewTime(LocalDateTime.now());
        record.setReviewNote(reviewNote);
        record.setStatus(status);
        
        return compensationRecordRepository.save(record);
    }

    @Transactional
    public CompensationRecord archiveCompensation(Long compensationId) {
        CompensationRecord record = compensationRecordRepository.findById(compensationId)
                .orElseThrow(() -> new RuntimeException("补偿记录不存在"));
        
        if (record.getStatus() != CompensationStatus.COMPLETED) {
            throw new RuntimeException("只有已完成的补偿才能归档");
        }
        
        record.setIsArchived(true);
        record.setArchivedAt(LocalDateTime.now());
        
        return compensationRecordRepository.save(record);
    }

    public List<CompensationRecord> getAllCompensationRecords() {
        return compensationRecordRepository.findWithInterruptRecordByArchivedStatus(false);
    }

    public List<CompensationRecord> getPendingCompensations() {
        return compensationRecordRepository.findWithInterruptRecordByStatus(CompensationStatus.PENDING);
    }

    public List<CompensationRecord> getCompensationRecordsByInterrupt(Long interruptId) {
        return compensationRecordRepository.findByInterruptRecordId(interruptId);
    }
}
