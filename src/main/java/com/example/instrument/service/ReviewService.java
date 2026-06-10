package com.example.instrument.service;

import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.entity.ReviewRecord;
import com.example.instrument.entity.ReviewRecord.ReviewResult;
import com.example.instrument.repository.InstrumentPackageRepository;
import com.example.instrument.repository.ReviewRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRecordRepository reviewRecordRepository;
    private final InstrumentPackageRepository packageRepository;
    private final SterilizationService sterilizationService;
    
    public List<ReviewRecord> findByPackageId(Long packageId) {
        return reviewRecordRepository.findByInstrumentPackageId(packageId);
    }
    
    public Optional<ReviewRecord> findLatestByPackageId(Long packageId) {
        return reviewRecordRepository.findLatestByPackageId(packageId);
    }
    
    @Transactional
    public ReviewRecord createReview(Long packageId, ReviewResult result, String operator, String notes) {
        InstrumentPackage instrumentPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        boolean isExpired = sterilizationService.isPackageExpired(packageId);
        
        if (isExpired && result == ReviewResult.APPROVED) {
            throw new RuntimeException("灭菌批次已过期，无法放行");
        }
        
        ReviewRecord reviewRecord = ReviewRecord.builder()
                .reviewNo("REV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(instrumentPackage)
                .result(result)
                .operator(operator)
                .notes(notes)
                .build();
        
        ReviewRecord saved = reviewRecordRepository.save(reviewRecord);
        
        if (result == ReviewResult.APPROVED) {
            instrumentPackage.setStatus(PackageStatus.RELEASED);
        } else {
            instrumentPackage.setStatus(PackageStatus.PENDING_REVIEW);
        }
        
        packageRepository.save(instrumentPackage);
        
        return saved;
    }
}