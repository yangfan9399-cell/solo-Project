package com.example.instrument.repository;

import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstrumentPackageRepository extends JpaRepository<InstrumentPackage, Long> {
    
    Optional<InstrumentPackage> findByPackageCode(String packageCode);
    
    List<InstrumentPackage> findByStatus(PackageStatus status);
    
    List<InstrumentPackage> findByPackageNameContaining(String packageName);
    
    @Query("SELECT p FROM InstrumentPackage p ORDER BY p.updateTime DESC")
    List<InstrumentPackage> findAllOrderByUpdateTimeDesc();
    
    @Query("SELECT p FROM InstrumentPackage p WHERE p.status IN :statuses ORDER BY p.updateTime DESC")
    List<InstrumentPackage> findByStatusIn(List<PackageStatus> statuses);
}