package com.example.instrument.service;

import com.example.instrument.entity.AbnormalRecord;
import com.example.instrument.entity.AbnormalRecord.AbnormalType;
import com.example.instrument.entity.InventoryRecord;
import com.example.instrument.entity.InventoryRecord.InventoryResult;
import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.repository.AbnormalRecordRepository;
import com.example.instrument.repository.InventoryRecordRepository;
import com.example.instrument.repository.InstrumentPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService {
    
    private final InventoryRecordRepository inventoryRecordRepository;
    private final InstrumentPackageRepository packageRepository;
    private final AbnormalRecordRepository abnormalRecordRepository;
    
    public List<InventoryRecord> findByPackageId(Long packageId) {
        return inventoryRecordRepository.findByInstrumentPackageId(packageId);
    }
    
    public Optional<InventoryRecord> findLatestByPackageId(Long packageId) {
        return inventoryRecordRepository.findLatestByPackageId(packageId);
    }
    
    @Transactional
    public InventoryRecord createInventory(Long packageId, Integer actualQuantity, Integer expectedQuantity, 
                                           String operator, String notes) {
        InstrumentPackage instrumentPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        InventoryResult result = InventoryResult.NORMAL;
        if (actualQuantity < expectedQuantity) {
            result = InventoryResult.MISSING;
        } else if (actualQuantity > expectedQuantity) {
            result = InventoryResult.EXTRA;
        }
        
        InventoryRecord inventoryRecord = InventoryRecord.builder()
                .inventoryNo("INV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(instrumentPackage)
                .actualQuantity(actualQuantity)
                .expectedQuantity(expectedQuantity)
                .result(result)
                .operator(operator)
                .notes(notes)
                .build();
        
        InventoryRecord saved = inventoryRecordRepository.save(inventoryRecord);
        
        if (result != InventoryResult.NORMAL) {
            AbnormalRecord abnormalRecord = AbnormalRecord.builder()
                    .instrumentPackage(instrumentPackage)
                    .abnormalType(AbnormalType.INSTRUMENT_MISSING)
                    .reason(result == InventoryResult.MISSING ? "器械缺失" : "器械多余")
                    .handler(operator)
                    .resolveStatus(AbnormalRecord.ResolveStatus.PENDING)
                    .build();
            abnormalRecordRepository.save(abnormalRecord);
            
            instrumentPackage.setStatus(PackageStatus.ABNORMAL);
            packageRepository.save(instrumentPackage);
        } else {
            instrumentPackage.setStatus(PackageStatus.INVENTORY_COMPLETED);
            packageRepository.save(instrumentPackage);
        }
        
        return saved;
    }
}