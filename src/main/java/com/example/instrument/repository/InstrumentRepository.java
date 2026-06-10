package com.example.instrument.repository;

import com.example.instrument.entity.Instrument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstrumentRepository extends JpaRepository<Instrument, Long> {
    
    List<Instrument> findByInstrumentPackageId(Long packageId);
    
    List<Instrument> findByInstrumentType(String instrumentType);
    
    List<Instrument> findByInstrumentPackagePackageCode(String packageCode);
}