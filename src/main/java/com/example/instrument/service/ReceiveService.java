package com.example.instrument.service;

import com.example.instrument.entity.AbnormalRecord;
import com.example.instrument.entity.AbnormalRecord.AbnormalType;
import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.entity.ReceiveRecord;
import com.example.instrument.entity.ReceiveRecord.ReceiveResult;
import com.example.instrument.repository.AbnormalRecordRepository;
import com.example.instrument.repository.InstrumentPackageRepository;
import com.example.instrument.repository.ReceiveRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReceiveService {
    
    private final ReceiveRecordRepository receiveRecordRepository;
    private final InstrumentPackageRepository packageRepository;
    private final AbnormalRecordRepository abnormalRecordRepository;
    
    public List<ReceiveRecord> findByPackageId(Long packageId) {
        return receiveRecordRepository.findByInstrumentPackageId(packageId);
    }
    
    public Optional<ReceiveRecord> findLatestByPackageId(Long packageId) {
        return receiveRecordRepository.findLatestByPackageId(packageId);
    }
    
    @Transactional
    public ReceiveRecord createReceive(Long packageId, String department, ReceiveResult result,
                                       String operator, String notes) {
        InstrumentPackage instrumentPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        ReceiveRecord receiveRecord = ReceiveRecord.builder()
                .receiveNo("REC" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(instrumentPackage)
                .department(department)
                .result(result)
                .operator(operator)
                .notes(notes)
                .build();
        
        ReceiveRecord saved = receiveRecordRepository.save(receiveRecord);
        
        if (result == ReceiveResult.ACCEPTED) {
            instrumentPackage.setStatus(PackageStatus.RECEIVED);
        } else {
            instrumentPackage.setStatus(PackageStatus.PENDING_RECEIVE);
            
            AbnormalRecord abnormalRecord = AbnormalRecord.builder()
                    .instrumentPackage(instrumentPackage)
                    .abnormalType(AbnormalType.RETURNED_FROM_OPERATING_ROOM)
                    .reason("手术室退回: " + (notes != null ? notes : "未说明原因"))
                    .handler(operator)
                    .resolveStatus(AbnormalRecord.ResolveStatus.PENDING)
                    .build();
            abnormalRecordRepository.save(abnormalRecord);
        }
        
        packageRepository.save(instrumentPackage);
        
        return saved;
    }
}