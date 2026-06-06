package com.manufacturing.fixture.service;

import com.manufacturing.fixture.entity.*;
import com.manufacturing.fixture.repository.BorrowRecordRepository;
import com.manufacturing.fixture.repository.DamageRecordRepository;
import com.manufacturing.fixture.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BorrowService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final FixtureRepository fixtureRepository;
    private final DamageRecordRepository damageRecordRepository;

    public List<BorrowRecord> findAll() {
        return borrowRecordRepository.findAll();
    }

    public Optional<BorrowRecord> findById(Long id) {
        return borrowRecordRepository.findById(id);
    }

    public List<BorrowRecord> findByFixtureId(Long fixtureId) {
        return borrowRecordRepository.findByFixtureIdOrderByCreatedAtDesc(fixtureId);
    }

    public List<BorrowRecord> findByProductionLine(String productionLine) {
        return borrowRecordRepository.findByProductionLineOrderByCreatedAtDesc(productionLine);
    }

    public List<BorrowRecord> findOverdueBorrows() {
        return borrowRecordRepository.findOverdueBorrows(LocalDate.now());
    }

    @Transactional
    public BorrowRecord applyBorrow(Long fixtureId, String applicant, String productionLine, String purpose, LocalDate expectedReturnDate) {
        Fixture fixture = fixtureRepository.findById(fixtureId)
                .orElseThrow(() -> new RuntimeException("夹具不存在"));

        if (fixture.isCalibrationExpired()) {
            throw new RuntimeException("夹具校准已过期，禁止出库！请先送检校准。");
        }

        if (fixture.getStatus() != FixtureStatus.AVAILABLE) {
            throw new RuntimeException("夹具当前状态为" + fixture.getStatus().getDescription() + "，无法借用");
        }

        BorrowRecord record = new BorrowRecord();
        record.setFixture(fixture);
        record.setApplicant(applicant);
        record.setProductionLine(productionLine);
        record.setPurpose(purpose);
        record.setExpectedReturnDate(expectedReturnDate);
        record.setStatus(BorrowStatus.PENDING_OUT);

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord confirmOutbound(Long borrowId, String adminConfirmer) {
        BorrowRecord record = borrowRecordRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));

        if (record.getStatus() != BorrowStatus.PENDING_OUT) {
            throw new RuntimeException("当前状态不允许出库确认");
        }

        Fixture fixture = record.getFixture();
        if (fixture.isCalibrationExpired()) {
            throw new RuntimeException("夹具校准已过期，禁止出库！请先送检校准。");
        }

        fixture.setStatus(FixtureStatus.BORROWED);
        fixtureRepository.save(fixture);

        record.setStatus(BorrowStatus.BORROWED);
        record.setBorrowDate(LocalDateTime.now());
        record.setAdminConfirmer(adminConfirmer);

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord returnFixture(Long borrowId, boolean damaged, String damageDescription) {
        BorrowRecord record = borrowRecordRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));

        if (record.getStatus() != BorrowStatus.BORROWED && record.getStatus() != BorrowStatus.OVERDUE) {
            throw new RuntimeException("当前状态不允许归还");
        }

        record.setActualReturnDate(LocalDateTime.now());
        record.setDamageDescription(damageDescription);

        if (damaged) {
            record.setStatus(BorrowStatus.PENDING_RETURN);
        } else {
            record.setStatus(BorrowStatus.PENDING_RETURN);
        }

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord qualityReview(Long borrowId, String qualityReviewer, QualityResult result, String qualityRemark) {
        BorrowRecord record = borrowRecordRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));

        if (record.getStatus() != BorrowStatus.PENDING_RETURN) {
            throw new RuntimeException("当前状态不允许质量复核");
        }

        record.setQualityReviewer(qualityReviewer);
        record.setQualityResult(result);
        record.setQualityRemark(qualityRemark);

        Fixture fixture = record.getFixture();

        switch (result) {
            case USABLE:
                fixture.setStatus(FixtureStatus.AVAILABLE);
                record.setStatus(BorrowStatus.RETURNED_NORMAL);
                break;
            case NEED_REPAIR:
                fixture.setStatus(FixtureStatus.IN_MAINTENANCE);
                record.setStatus(BorrowStatus.RETURNED_DAMAGED);
                createDamageRecord(record, "需维修", qualityRemark);
                break;
            case SCRAP:
                fixture.setStatus(FixtureStatus.SCRAPPED);
                record.setStatus(BorrowStatus.RETURNED_DAMAGED);
                createDamageRecord(record, "报废", qualityRemark);
                break;
        }

        fixtureRepository.save(fixture);
        return borrowRecordRepository.save(record);
    }

    private void createDamageRecord(BorrowRecord record, String damageType, String description) {
        DamageRecord damageRecord = new DamageRecord();
        damageRecord.setFixture(record.getFixture());
        damageRecord.setBorrowRecord(record);
        damageRecord.setDamageType(damageType);
        damageRecord.setDescription(description);
        damageRecord.setOccurrenceTime(LocalDateTime.now());
        damageRecord.setReporter(record.getQualityReviewer());
        damageRecord.setProductionLine(record.getProductionLine());
        damageRecord.setRepairCost(BigDecimal.ZERO);
        damageRecord.setDowntimeHours(0);
        damageRecordRepository.save(damageRecord);
    }

    @Transactional
    public BorrowRecord cancelBorrow(Long borrowId) {
        BorrowRecord record = borrowRecordRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));

        if (record.getStatus() != BorrowStatus.PENDING_OUT) {
            throw new RuntimeException("当前状态不允许取消");
        }

        record.setStatus(BorrowStatus.CANCELLED);
        return borrowRecordRepository.save(record);
    }

    public List<BorrowRecord> findByStatus(BorrowStatus status) {
        return borrowRecordRepository.findByStatus(status);
    }

    public List<BorrowRecord> findByStatusAndProductionLine(BorrowStatus status, String productionLine) {
        return borrowRecordRepository.findByStatusAndProductionLine(status, productionLine);
    }

    @Transactional
    public void updateOverdueStatus() {
        List<BorrowRecord> overdueBorrows = borrowRecordRepository.findOverdueBorrows(LocalDate.now());
        for (BorrowRecord record : overdueBorrows) {
            if (record.getStatus() == BorrowStatus.BORROWED) {
                record.setStatus(BorrowStatus.OVERDUE);
                borrowRecordRepository.save(record);
            }
        }
    }
}
