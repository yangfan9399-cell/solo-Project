package com.manufacturing.fixture.service;

import com.manufacturing.fixture.entity.CalibrationRecord;
import com.manufacturing.fixture.entity.CalibrationResult;
import com.manufacturing.fixture.entity.Fixture;
import com.manufacturing.fixture.entity.FixtureStatus;
import com.manufacturing.fixture.repository.CalibrationRecordRepository;
import com.manufacturing.fixture.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CalibrationService {

    private final CalibrationRecordRepository calibrationRecordRepository;
    private final FixtureRepository fixtureRepository;

    public List<CalibrationRecord> findAll() {
        return calibrationRecordRepository.findAll();
    }

    public Optional<CalibrationRecord> findById(Long id) {
        return calibrationRecordRepository.findById(id);
    }

    public List<CalibrationRecord> findByFixtureId(Long fixtureId) {
        return calibrationRecordRepository.findByFixtureIdOrderByCalibrationDateDesc(fixtureId);
    }

    @Transactional
    public CalibrationRecord addCalibrationRecord(Long fixtureId, LocalDate calibrationDate,
                                                   String calibrationAgency, String certificateNo,
                                                   CalibrationResult result, LocalDate nextCalibrationDate,
                                                   String calibrator, String remark) {
        Fixture fixture = fixtureRepository.findById(fixtureId)
                .orElseThrow(() -> new RuntimeException("夹具不存在"));

        CalibrationRecord record = new CalibrationRecord();
        record.setFixture(fixture);
        record.setCalibrationDate(calibrationDate);
        record.setCalibrationAgency(calibrationAgency);
        record.setCertificateNo(certificateNo);
        record.setResult(result);
        record.setNextCalibrationDate(nextCalibrationDate);
        record.setCalibrator(calibrator);
        record.setRemark(remark);

        if (result == CalibrationResult.PASSED) {
            fixture.setLastCalibrationDate(calibrationDate);
            fixture.setNextCalibrationDate(nextCalibrationDate);
            fixture.setCalibrationCertificate(certificateNo);
            if (fixture.getStatus() == FixtureStatus.IN_CALIBRATION) {
                fixture.setStatus(FixtureStatus.AVAILABLE);
            }
        }

        fixtureRepository.save(fixture);
        return calibrationRecordRepository.save(record);
    }

    @Transactional
    public void sendForCalibration(Long fixtureId) {
        Fixture fixture = fixtureRepository.findById(fixtureId)
                .orElseThrow(() -> new RuntimeException("夹具不存在"));

        if (fixture.getStatus() == FixtureStatus.AVAILABLE || fixture.getStatus() == FixtureStatus.IN_MAINTENANCE) {
            fixture.setStatus(FixtureStatus.IN_CALIBRATION);
            fixtureRepository.save(fixture);
        } else {
            throw new RuntimeException("当前夹具状态不允许送检");
        }
    }

    public List<Fixture> getExpiredCalibrationFixtures() {
        return fixtureRepository.findExpiredCalibration(LocalDate.now());
    }

    public List<Fixture> getWarningCalibrationFixtures() {
        return fixtureRepository.findCalibrationWarning(LocalDate.now(), LocalDate.now().plusDays(7));
    }
}
