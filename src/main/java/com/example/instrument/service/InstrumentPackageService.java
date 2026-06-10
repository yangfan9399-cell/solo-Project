package com.example.instrument.service;

import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.repository.InstrumentPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InstrumentPackageService {
    
    private final InstrumentPackageRepository packageRepository;
    
    public List<InstrumentPackage> findAll() {
        return packageRepository.findAllOrderByUpdateTimeDesc();
    }
    
    public List<InstrumentPackage> findByStatus(PackageStatus status) {
        return packageRepository.findByStatus(status);
    }
    
    public List<InstrumentPackage> findByStatusIn(List<PackageStatus> statuses) {
        return packageRepository.findByStatusIn(statuses);
    }
    
    public Optional<InstrumentPackage> findById(Long id) {
        return packageRepository.findById(id);
    }
    
    public Optional<InstrumentPackage> findByCode(String packageCode) {
        return packageRepository.findByPackageCode(packageCode);
    }
    
    @Transactional
    public InstrumentPackage create(InstrumentPackage instrumentPackage) {
        return packageRepository.save(instrumentPackage);
    }
    
    @Transactional
    public InstrumentPackage updateStatus(Long id, PackageStatus status) {
        InstrumentPackage instrumentPackage = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        instrumentPackage.setStatus(status);
        return packageRepository.save(instrumentPackage);
    }
    
    @Transactional
    public InstrumentPackage save(InstrumentPackage instrumentPackage) {
        return packageRepository.save(instrumentPackage);
    }
    
    @Transactional
    public void deleteById(Long id) {
        packageRepository.deleteById(id);
    }
}