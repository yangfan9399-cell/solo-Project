package com.manufacturing.fixture.service;

import com.manufacturing.fixture.entity.DamageRecord;
import com.manufacturing.fixture.repository.DamageRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DamageService {

    private final DamageRecordRepository damageRecordRepository;

    public List<DamageRecord> findAll() {
        return damageRecordRepository.findAll();
    }

    public Optional<DamageRecord> findById(Long id) {
        return damageRecordRepository.findById(id);
    }

    public List<DamageRecord> findByFixtureId(Long fixtureId) {
        return damageRecordRepository.findByFixtureIdOrderByOccurrenceTimeDesc(fixtureId);
    }

    public List<DamageRecord> findByProductionLine(String productionLine) {
        return damageRecordRepository.findByProductionLineOrderByOccurrenceTimeDesc(productionLine);
    }
}
