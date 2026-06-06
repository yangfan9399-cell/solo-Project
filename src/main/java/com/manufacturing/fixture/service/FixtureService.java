package com.manufacturing.fixture.service;

import com.manufacturing.fixture.entity.Fixture;
import com.manufacturing.fixture.entity.FixtureStatus;
import com.manufacturing.fixture.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FixtureService {

    private final FixtureRepository fixtureRepository;

    public List<Fixture> findAll() {
        return fixtureRepository.findAll();
    }

    public Optional<Fixture> findById(Long id) {
        return fixtureRepository.findById(id);
    }

    public Optional<Fixture> findByFixtureNo(String fixtureNo) {
        return fixtureRepository.findByFixtureNo(fixtureNo);
    }

    public List<Fixture> findByStatus(FixtureStatus status) {
        return fixtureRepository.findByStatus(status);
    }

    public List<Fixture> findExpiredCalibration() {
        return fixtureRepository.findExpiredCalibration(LocalDate.now());
    }

    public List<Fixture> findCalibrationWarning() {
        return fixtureRepository.findCalibrationWarning(LocalDate.now(), LocalDate.now().plusDays(7));
    }

    @Transactional
    public Fixture save(Fixture fixture) {
        return fixtureRepository.save(fixture);
    }

    @Transactional
    public Fixture updateStatus(Long id, FixtureStatus status) {
        Fixture fixture = fixtureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("夹具不存在"));
        fixture.setStatus(status);
        return fixtureRepository.save(fixture);
    }

    @Transactional
    public void deleteById(Long id) {
        fixtureRepository.deleteById(id);
    }

    public boolean existsByFixtureNo(String fixtureNo) {
        return fixtureRepository.existsByFixtureNo(fixtureNo);
    }

    public List<Object[]> countByFixtureType() {
        return fixtureRepository.countByFixtureType();
    }

    public List<Object[]> countByStatus() {
        return fixtureRepository.countByStatus();
    }

    public long count() {
        return fixtureRepository.count();
    }

    public List<Fixture> findAvailableFixtures() {
        return fixtureRepository.findByStatus(FixtureStatus.AVAILABLE);
    }
}
