package com.manufacturing.fixture.config;

import com.manufacturing.fixture.entity.*;
import com.manufacturing.fixture.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final FixtureRepository fixtureRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final CalibrationRecordRepository calibrationRecordRepository;
    private final DamageRecordRepository damageRecordRepository;

    @Override
    public void run(String... args) {
        if (fixtureRepository.count() > 0) {
            return;
        }

        initFixtures();
        initCalibrationRecords();
        initBorrowRecords();
        initDamageRecords();
    }

    private void initFixtures() {
        Fixture f1 = createFixture("FIX-001", "精密定位夹具", "定位夹具", "CNC精加工",
                FixtureStatus.AVAILABLE, "A区-01柜", "张工",
                LocalDate.now().minusMonths(6), LocalDate.now().plusMonths(6),
                "高精度定位夹具，适用于精密零件加工");

        Fixture f2 = createFixture("FIX-002", "液压夹紧工装", "夹紧夹具", "组装工序",
                FixtureStatus.BORROWED, "B区-03柜", "李工",
                LocalDate.now().minusMonths(8), LocalDate.now().plusMonths(4),
                "液压驱动夹紧装置，适用于大型零件组装");

        Fixture f3 = createFixture("FIX-003", "三坐标检测夹具", "检测夹具", "质量检测",
                FixtureStatus.AVAILABLE, "C区-02柜", "王工",
                LocalDate.now().minusMonths(14), LocalDate.now().minusDays(30),
                "三坐标测量专用夹具，校准已过期！");

        Fixture f4 = createFixture("FIX-004", "焊接定位架", "焊接夹具", "焊接工序",
                FixtureStatus.IN_MAINTENANCE, "维修区", "赵工",
                LocalDate.now().minusMonths(3), LocalDate.now().plusMonths(9),
                "焊接工位专用定位夹具，维修中");

        Fixture f5 = createFixture("FIX-005", "冲压成型模", "冲压夹具", "冲压工序",
                FixtureStatus.AVAILABLE, "D区-01柜", "钱工",
                LocalDate.now().minusMonths(10), LocalDate.now().plusDays(5),
                "精密冲压模具，校准即将到期");

        Fixture f6 = createFixture("FIX-006", "装配工装台", "装配夹具", "总装工序",
                FixtureStatus.SCRAPPED, "报废区", "孙工",
                LocalDate.now().minusYears(2), LocalDate.now().minusYears(1),
                "已报废，使用年限到期");

        Fixture f7 = createFixture("FIX-007", "气动夹具", "夹紧夹具", "机加工序",
                FixtureStatus.AVAILABLE, "A区-02柜", "周工",
                LocalDate.now().minusMonths(2), LocalDate.now().plusMonths(10),
                "气动快速夹紧夹具");

        Fixture f8 = createFixture("FIX-008", "专用检测治具", "检测夹具", "进料检验",
                FixtureStatus.IN_CALIBRATION, "校准室", "吴工",
                LocalDate.now().minusMonths(12), LocalDate.now().minusDays(15),
                "送外校准中");

        fixtureRepository.save(f1);
        fixtureRepository.save(f2);
        fixtureRepository.save(f3);
        fixtureRepository.save(f4);
        fixtureRepository.save(f5);
        fixtureRepository.save(f6);
        fixtureRepository.save(f7);
        fixtureRepository.save(f8);
    }

    private Fixture createFixture(String fixtureNo, String fixtureName, String fixtureType,
                                  String applicableProcess, FixtureStatus status, String location,
                                  String responsiblePerson, LocalDate lastCalibrationDate,
                                  LocalDate nextCalibrationDate, String description) {
        Fixture fixture = new Fixture();
        fixture.setFixtureNo(fixtureNo);
        fixture.setFixtureName(fixtureName);
        fixture.setFixtureType(fixtureType);
        fixture.setApplicableProcess(applicableProcess);
        fixture.setStatus(status);
        fixture.setLocation(location);
        fixture.setResponsiblePerson(responsiblePerson);
        fixture.setLastCalibrationDate(lastCalibrationDate);
        fixture.setNextCalibrationDate(nextCalibrationDate);
        fixture.setCalibrationCertificate("CAL-" + fixtureNo + "-2024");
        fixture.setDescription(description);
        fixture.setCreatedAt(LocalDateTime.now().minusMonths(6));
        fixture.setUpdatedAt(LocalDateTime.now());
        return fixture;
    }

    private void initCalibrationRecords() {
        Fixture f1 = fixtureRepository.findByFixtureNo("FIX-001").orElseThrow();
        CalibrationRecord c1 = createCalibrationRecord(f1,
                LocalDate.now().minusMonths(6), "国家计量测试中心", "CAL-FIX-001-202401",
                CalibrationResult.PASSED, LocalDate.now().plusMonths(6), "刘校准师",
                "校准合格，精度满足要求");

        Fixture f2 = fixtureRepository.findByFixtureNo("FIX-002").orElseThrow();
        CalibrationRecord c2 = createCalibrationRecord(f2,
                LocalDate.now().minusMonths(8), "省计量院", "CAL-FIX-002-202311",
                CalibrationResult.PASSED, LocalDate.now().plusMonths(4), "陈校准师",
                "校准合格");

        Fixture f3 = fixtureRepository.findByFixtureNo("FIX-003").orElseThrow();
        CalibrationRecord c3 = createCalibrationRecord(f3,
                LocalDate.now().minusMonths(14), "市计量所", "CAL-FIX-003-202304",
                CalibrationResult.PASSED, LocalDate.now().minusDays(30), "杨校准师",
                "上次校准合格，现已过期");

        Fixture f4 = fixtureRepository.findByFixtureNo("FIX-004").orElseThrow();
        CalibrationRecord c4 = createCalibrationRecord(f4,
                LocalDate.now().minusMonths(3), "内部校准室", "CAL-FIX-004-202403",
                CalibrationResult.PASSED, LocalDate.now().plusMonths(9), "赵工",
                "内部校准合格");

        Fixture f5 = fixtureRepository.findByFixtureNo("FIX-005").orElseThrow();
        CalibrationRecord c5 = createCalibrationRecord(f5,
                LocalDate.now().minusMonths(10), "国家计量测试中心", "CAL-FIX-005-202308",
                CalibrationResult.PASSED, LocalDate.now().plusDays(5), "刘校准师",
                "校准合格，即将到期");

        Fixture f7 = fixtureRepository.findByFixtureNo("FIX-007").orElseThrow();
        CalibrationRecord c6 = createCalibrationRecord(f7,
                LocalDate.now().minusMonths(2), "省计量院", "CAL-FIX-007-202404",
                CalibrationResult.PASSED, LocalDate.now().plusMonths(10), "陈校准师",
                "新购校准");

        calibrationRecordRepository.save(c1);
        calibrationRecordRepository.save(c2);
        calibrationRecordRepository.save(c3);
        calibrationRecordRepository.save(c4);
        calibrationRecordRepository.save(c5);
        calibrationRecordRepository.save(c6);
    }

    private CalibrationRecord createCalibrationRecord(Fixture fixture, LocalDate calibrationDate,
                                                       String calibrationAgency, String certificateNo,
                                                       CalibrationResult result, LocalDate nextCalibrationDate,
                                                       String calibrator, String remark) {
        CalibrationRecord record = new CalibrationRecord();
        record.setFixture(fixture);
        record.setCalibrationDate(calibrationDate);
        record.setCalibrationAgency(calibrationAgency);
        record.setCertificateNo(certificateNo);
        record.setResult(result);
        record.setNextCalibrationDate(nextCalibrationDate);
        record.setCalibrator(calibrator);
        record.setRemark(remark);
        return record;
    }

    private void initBorrowRecords() {
        Fixture f1 = fixtureRepository.findByFixtureNo("FIX-001").orElseThrow();
        Fixture f2 = fixtureRepository.findByFixtureNo("FIX-002").orElseThrow();
        Fixture f3 = fixtureRepository.findByFixtureNo("FIX-003").orElseThrow();
        Fixture f4 = fixtureRepository.findByFixtureNo("FIX-004").orElseThrow();
        Fixture f6 = fixtureRepository.findByFixtureNo("FIX-006").orElseThrow();

        BorrowRecord b1 = new BorrowRecord();
        b1.setFixture(f1);
        b1.setApplicant("李操作员");
        b1.setProductionLine("A1线");
        b1.setPurpose("批次号B202405001零件加工");
        b1.setStatus(BorrowStatus.RETURNED_NORMAL);
        b1.setBorrowDate(LocalDateTime.now().minusDays(20));
        b1.setExpectedReturnDate(LocalDate.now().minusDays(15));
        b1.setActualReturnDate(LocalDateTime.now().minusDays(16));
        b1.setAdminConfirmer("王管理员");
        b1.setQualityReviewer("张质量");
        b1.setQualityResult(QualityResult.USABLE);
        b1.setQualityRemark("夹具完好，可继续使用");
        borrowRecordRepository.save(b1);

        BorrowRecord b2 = new BorrowRecord();
        b2.setFixture(f2);
        b2.setApplicant("赵操作员");
        b2.setProductionLine("B1线");
        b2.setPurpose("大型机架组装");
        b2.setStatus(BorrowStatus.OVERDUE);
        b2.setBorrowDate(LocalDateTime.now().minusDays(25));
        b2.setExpectedReturnDate(LocalDate.now().minusDays(10));
        b2.setAdminConfirmer("王管理员");
        borrowRecordRepository.save(b2);

        BorrowRecord b3 = new BorrowRecord();
        b3.setFixture(f4);
        b3.setApplicant("钱操作员");
        b3.setProductionLine("A2线");
        b3.setPurpose("焊接工位使用");
        b3.setStatus(BorrowStatus.RETURNED_DAMAGED);
        b3.setBorrowDate(LocalDateTime.now().minusDays(15));
        b3.setExpectedReturnDate(LocalDate.now().minusDays(10));
        b3.setActualReturnDate(LocalDateTime.now().minusDays(12));
        b3.setAdminConfirmer("李管理员");
        b3.setQualityReviewer("王质量");
        b3.setQualityResult(QualityResult.NEED_REPAIR);
        b3.setQualityRemark("定位销磨损，需维修更换");
        b3.setDamageDescription("定位销磨损严重，影响定位精度");
        borrowRecordRepository.save(b3);

        BorrowRecord b4 = new BorrowRecord();
        b4.setFixture(f6);
        b4.setApplicant("孙操作员");
        b4.setProductionLine("总装线");
        b4.setPurpose("产品总装");
        b4.setStatus(BorrowStatus.RETURNED_DAMAGED);
        b4.setBorrowDate(LocalDateTime.now().minusMonths(3));
        b4.setExpectedReturnDate(LocalDate.now().minusMonths(2).minusDays(20));
        b4.setActualReturnDate(LocalDateTime.now().minusMonths(2).minusDays(25));
        b4.setAdminConfirmer("王管理员");
        b4.setQualityReviewer("张质量");
        b4.setQualityResult(QualityResult.SCRAP);
        b4.setQualityRemark("主体结构开裂，无维修价值，建议报废");
        b4.setDamageDescription("主体结构开裂，无法修复");
        borrowRecordRepository.save(b4);

        BorrowRecord b5 = new BorrowRecord();
        b5.setFixture(f1);
        b5.setApplicant("周操作员");
        b5.setProductionLine("A1线");
        b5.setPurpose("小批量试产");
        b5.setStatus(BorrowStatus.PENDING_OUT);
        b5.setExpectedReturnDate(LocalDate.now().plusDays(5));
        borrowRecordRepository.save(b5);

        BorrowRecord b6 = new BorrowRecord();
        b6.setFixture(f3);
        b6.setApplicant("吴操作员");
        b6.setProductionLine("C1线");
        b6.setPurpose("检测工序使用");
        b6.setStatus(BorrowStatus.RETURNED_NORMAL);
        b6.setBorrowDate(LocalDateTime.now().minusMonths(2));
        b6.setExpectedReturnDate(LocalDate.now().minusMonths(1).minusDays(20));
        b6.setActualReturnDate(LocalDateTime.now().minusMonths(1).minusDays(22));
        b6.setAdminConfirmer("李管理员");
        b6.setQualityReviewer("王质量");
        b6.setQualityResult(QualityResult.USABLE);
        b6.setQualityRemark("正常归还");
        borrowRecordRepository.save(b6);

        BorrowRecord b7 = new BorrowRecord();
        b7.setFixture(f2);
        b7.setApplicant("郑操作员");
        b7.setProductionLine("B2线");
        b7.setPurpose("备用");
        b7.setStatus(BorrowStatus.RETURNED_NORMAL);
        b7.setBorrowDate(LocalDateTime.now().minusMonths(3));
        b7.setExpectedReturnDate(LocalDate.now().minusMonths(2).minusDays(10));
        b7.setActualReturnDate(LocalDateTime.now().minusMonths(2).minusDays(15));
        b7.setAdminConfirmer("王管理员");
        b7.setQualityReviewer("张质量");
        b7.setQualityResult(QualityResult.USABLE);
        borrowRecordRepository.save(b7);

        BorrowRecord b8 = new BorrowRecord();
        b8.setFixture(f4);
        b8.setApplicant("冯操作员");
        b8.setProductionLine("A2线");
        b8.setPurpose("试产线使用");
        b8.setStatus(BorrowStatus.PENDING_RETURN);
        b8.setBorrowDate(LocalDateTime.now().minusDays(8));
        b8.setExpectedReturnDate(LocalDate.now().minusDays(3));
        b8.setActualReturnDate(LocalDateTime.now().minusDays(2));
        b8.setDamageDescription("轻微磕碰，需要检查");
        b8.setAdminConfirmer("李管理员");
        borrowRecordRepository.save(b8);
    }

    private void initDamageRecords() {
        Fixture f4 = fixtureRepository.findByFixtureNo("FIX-004").orElseThrow();
        Fixture f6 = fixtureRepository.findByFixtureNo("FIX-006").orElseThrow();

        DamageRecord d1 = new DamageRecord();
        d1.setFixture(f4);
        d1.setDamageType("磨损");
        d1.setDescription("定位销磨损严重，超过公差范围");
        d1.setOccurrenceTime(LocalDateTime.now().minusDays(12));
        d1.setReporter("钱操作员");
        d1.setProductionLine("A2线");
        d1.setRepairCost(new BigDecimal("850"));
        d1.setDowntimeHours(4);
        d1.setHandlingMeasures("更换定位销，重新校准");
        d1.setHandler("张维修");
        damageRecordRepository.save(d1);

        DamageRecord d2 = new DamageRecord();
        d2.setFixture(f6);
        d2.setDamageType("开裂");
        d2.setDescription("主体结构开裂，受力变形");
        d2.setOccurrenceTime(LocalDateTime.now().minusMonths(2).minusDays(25));
        d2.setReporter("孙操作员");
        d2.setProductionLine("总装线");
        d2.setRepairCost(BigDecimal.ZERO);
        d2.setDowntimeHours(8);
        d2.setHandlingMeasures("报废处理，已申请新夹具");
        d2.setHandler("王主管");
        damageRecordRepository.save(d2);

        DamageRecord d3 = new DamageRecord();
        d3.setFixture(f4);
        d3.setDamageType("变形");
        d3.setDescription("夹臂轻微变形，夹紧力不足");
        d3.setOccurrenceTime(LocalDateTime.now().minusDays(2));
        d3.setReporter("冯操作员");
        d3.setProductionLine("A2线");
        d3.setRepairCost(new BigDecimal("320"));
        d3.setDowntimeHours(2);
        d3.setHandlingMeasures("校正夹臂，调整夹紧力");
        d3.setHandler("李维修");
        damageRecordRepository.save(d3);
    }
}
