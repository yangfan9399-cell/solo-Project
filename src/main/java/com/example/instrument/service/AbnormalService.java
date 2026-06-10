package com.example.instrument.service;

import com.example.instrument.entity.AbnormalRecord;
import com.example.instrument.entity.AbnormalRecord.AbnormalType;
import com.example.instrument.entity.AbnormalRecord.ResolveStatus;
import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.repository.AbnormalRecordRepository;
import com.example.instrument.repository.InstrumentPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AbnormalService {
    
    private final AbnormalRecordRepository abnormalRecordRepository;
    private final InstrumentPackageRepository packageRepository;
    
    public List<AbnormalRecord> findByPackageId(Long packageId) {
        return abnormalRecordRepository.findByInstrumentPackageId(packageId);
    }
    
    public List<AbnormalRecord> findByType(AbnormalType abnormalType) {
        return abnormalRecordRepository.findByAbnormalType(abnormalType);
    }
    
    public List<AbnormalRecord> findByResolveStatus(ResolveStatus resolveStatus) {
        return abnormalRecordRepository.findByResolveStatus(resolveStatus);
    }
    
    public List<AbnormalRecord> findPendingAbnormals() {
        return abnormalRecordRepository.findByResolveStatus(ResolveStatus.PENDING);
    }
    
    @Transactional
    public AbnormalRecord resolve(Long id, String handler, String resolveNotes) {
        AbnormalRecord abnormalRecord = abnormalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("异常记录不存在"));
        
        abnormalRecord.setResolveStatus(ResolveStatus.RESOLVED);
        abnormalRecord.setHandler(handler);
        abnormalRecord.setResolveNotes(resolveNotes);
        abnormalRecord.setResolveTime(LocalDateTime.now());
        
        AbnormalRecord saved = abnormalRecordRepository.save(abnormalRecord);
        
        InstrumentPackage instrumentPackage = abnormalRecord.getInstrumentPackage();
        instrumentPackage.setStatus(PackageStatus.PENDING_INVENTORY);
        packageRepository.save(instrumentPackage);
        
        return saved;
    }
}