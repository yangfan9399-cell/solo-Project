package com.example.instrument.service;

import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.entity.IssueRecord;
import com.example.instrument.repository.InstrumentPackageRepository;
import com.example.instrument.repository.IssueRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IssueService {
    
    private final IssueRecordRepository issueRecordRepository;
    private final InstrumentPackageRepository packageRepository;
    private final SterilizationService sterilizationService;
    
    public List<IssueRecord> findByPackageId(Long packageId) {
        return issueRecordRepository.findByInstrumentPackageId(packageId);
    }
    
    public Optional<IssueRecord> findLatestByPackageId(Long packageId) {
        return issueRecordRepository.findLatestByPackageId(packageId);
    }
    
    @Transactional
    public IssueRecord createIssue(Long packageId, String department, String operator, String notes) {
        InstrumentPackage instrumentPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        if (instrumentPackage.getStatus() != PackageStatus.RELEASED) {
            throw new RuntimeException("器械包未放行，无法发放");
        }
        
        boolean isExpired = sterilizationService.isPackageExpired(packageId);
        if (isExpired) {
            throw new RuntimeException("灭菌批次已过期，禁止发放");
        }
        
        IssueRecord issueRecord = IssueRecord.builder()
                .issueNo("ISS" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(instrumentPackage)
                .department(department)
                .operator(operator)
                .notes(notes)
                .build();
        
        IssueRecord saved = issueRecordRepository.save(issueRecord);
        
        instrumentPackage.setStatus(PackageStatus.ISSUED);
        packageRepository.save(instrumentPackage);
        
        return saved;
    }
    
    @Transactional
    public void returnPackage(Long packageId, String operator, String notes) {
        InstrumentPackage instrumentPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        instrumentPackage.setStatus(PackageStatus.RETURNED);
        packageRepository.save(instrumentPackage);
    }
}