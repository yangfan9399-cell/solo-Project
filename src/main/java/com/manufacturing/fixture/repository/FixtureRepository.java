package com.manufacturing.fixture.repository;

import com.manufacturing.fixture.entity.Fixture;
import com.manufacturing.fixture.entity.FixtureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FixtureRepository extends JpaRepository<Fixture, Long> {

    Optional<Fixture> findByFixtureNo(String fixtureNo);

    List<Fixture> findByStatus(FixtureStatus status);

    List<Fixture> findByFixtureType(String fixtureType);

    @Query("SELECT f FROM Fixture f WHERE f.nextCalibrationDate < :date AND f.status != 'SCRAPPED'")
    List<Fixture> findExpiredCalibration(LocalDate date);

    @Query("SELECT f FROM Fixture f WHERE f.nextCalibrationDate BETWEEN :startDate AND :endDate AND f.status != 'SCRAPPED'")
    List<Fixture> findCalibrationWarning(LocalDate startDate, LocalDate endDate);

    @Query("SELECT f.fixtureType, COUNT(f) FROM Fixture f GROUP BY f.fixtureType")
    List<Object[]> countByFixtureType();

    @Query("SELECT f.status, COUNT(f) FROM Fixture f GROUP BY f.status")
    List<Object[]> countByStatus();

    boolean existsByFixtureNo(String fixtureNo);

    List<Fixture> findByStatusNot(FixtureStatus status);

    @Query("SELECT f FROM Fixture f WHERE f.status = 'AVAILABLE' AND (f.nextCalibrationDate IS NULL OR f.nextCalibrationDate >= :date)")
    List<Fixture> findAvailableAndCalibrationValid(LocalDate date);
}
