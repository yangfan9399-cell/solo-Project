package com.example.instrument.service;

import com.example.instrument.entity.AbnormalRecord;
import com.example.instrument.entity.AbnormalRecord.AbnormalType;
import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.entity.SterilizationBatch;
import com.example.instrument.repository.AbnormalRecordRepository;
import com.example.instrument.repository.InstrumentPackageRepository;
import com.example.instrument.repository.SterilizationBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SterilizationService {
    
    private final SterilizationBatchRepository batchRepository;
    private final InstrumentPackageRepository packageRepository;
    private final AbnormalRecordRepository abnormalRecordRepository;
    
    public List<SterilizationBatch> findByPackageId(Long packageId) {
        return batchRepository.findByInstrumentPackageId(packageId);
    }
    
    public Optional<SterilizationBatch> findLatestByPackageId(Long packageId) {
        return batchRepository.findLatestByPackageId(packageId);
    }
    
    public List<SterilizationBatch> findExpiredBatches() {
        return batchRepository.findExpiredBatches(LocalDate.now());
    }
    
    @Transactional
    public SterilizationBatch createBatch(Long packageId, String sterilizerNo, LocalDate sterilizationDate,
                                          LocalDate expiryDate, String operator, String notes) {
        InstrumentPackage instrumentPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        SterilizationBatch batch = SterilizationBatch.builder()
                .batchNo("STE" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(instrumentPackage)
                .sterilizerNo(sterilizerNo)
                .sterilizationDate(sterilizationDate)
                .expiryDate(expiryDate)
                .operator(operator)
                .notes(notes)
                .build();
        
        SterilizationBatch saved = batchRepository.save(batch);
        
        instrumentPackage.setStatus(PackageStatus.STERILIZATION_COMPLETED);
        packageRepository.save(instrumentPackage);
        
        return saved;
    }
    
    @Transactional
    public void checkExpiredBatches() {
        List<SterilizationBatch> expiredBatches = findExpiredBatches();
        for (SterilizationBatch batch : expiredBatches) {
            InstrumentPackage instrumentPackage = batch.getInstrumentPackage();
            
            if (instrumentPackage.getStatus() != PackageStatus.ABNORMAL) {
                AbnormalRecord abnormalRecord = AbnormalRecord.builder()
                        .instrumentPackage(instrumentPackage)
                        .abnormalType(AbnormalType.EXPIRED_STERILIZATION)
                        .reason("灭菌批次过期，有效期至: " + batch.getExpiryDate())
                        .resolveStatus(AbnormalRecord.ResolveStatus.PENDING)
                        .build();
                abnormalRecordRepository.save(abnormalRecord);
                
                instrumentPackage.setStatus(PackageStatus.ABNORMAL);
                packageRepository.save(instrumentPackage);
            }
        }
    }
    
    public boolean isPackageExpired(Long packageId) {
        Optional<SterilizationBatch> latestBatch = findLatestByPackageId(packageId);
        return latestBatch.map(SterilizationBatch::isExpired).orElse(true);
    }
}