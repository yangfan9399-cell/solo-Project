package com.example.instrument.config;

import com.example.instrument.entity.*;
import com.example.instrument.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final InstrumentPackageRepository packageRepository;
    private final InstrumentRepository instrumentRepository;
    private final InventoryRecordRepository inventoryRecordRepository;
    private final SterilizationBatchRepository sterilizationBatchRepository;
    private final ReceiveRecordRepository receiveRecordRepository;
    private final ReviewRecordRepository reviewRecordRepository;
    private final IssueRecordRepository issueRecordRepository;
    private final AbnormalRecordRepository abnormalRecordRepository;
    private final DepartmentRepository departmentRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (packageRepository.count() > 0) {
            return;
        }
        
        initDepartments();
        initNormalReleasePackage();
        initMissingInstrumentPackage();
        initExpiredSterilizationPackage();
        initReturnedPackage();
    }
    
    private void initDepartments() {
        Department dept1 = Department.builder()
                .deptCode("OR01")
                .deptName("手术室一")
                .deptType(Department.DeptType.OPERATING_ROOM)
                .status(true)
                .build();
        departmentRepository.save(dept1);
        
        Department dept2 = Department.builder()
                .deptCode("OR02")
                .deptName("手术室二")
                .deptType(Department.DeptType.OPERATING_ROOM)
                .status(true)
                .build();
        departmentRepository.save(dept2);
        
        Department dept3 = Department.builder()
                .deptCode("SR01")
                .deptName("供应室")
                .deptType(Department.DeptType.SUPPLY_ROOM)
                .status(true)
                .build();
        departmentRepository.save(dept3);
    }
    
    private void initNormalReleasePackage() {
        InstrumentPackage pkg = InstrumentPackage.builder()
                .packageCode("PKG-NORM-001")
                .packageName("普通外科器械包")
                .status(InstrumentPackage.PackageStatus.RELEASED)
                .build();
        pkg = packageRepository.save(pkg);
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-001")
                .instrumentName("手术刀")
                .instrumentType("切割器械")
                .specification("10号")
                .quantity(2)
                .unit("把")
                .instrumentPackage(pkg)
                .build());
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-002")
                .instrumentName("止血钳")
                .instrumentType("夹持器械")
                .specification("14cm")
                .quantity(4)
                .unit("把")
                .instrumentPackage(pkg)
                .build());
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-003")
                .instrumentName("组织剪")
                .instrumentType("剪切器械")
                .specification("直头")
                .quantity(2)
                .unit("把")
                .instrumentPackage(pkg)
                .build());
        
        InventoryRecord inventoryRecord = InventoryRecord.builder()
                .inventoryNo("INV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .actualQuantity(8)
                .expectedQuantity(8)
                .result(InventoryRecord.InventoryResult.NORMAL)
                .operator("张三")
                .notes("清点正常")
                .build();
        inventoryRecordRepository.save(inventoryRecord);
        
        SterilizationBatch batch = SterilizationBatch.builder()
                .batchNo("STE" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .sterilizerNo("STE-001")
                .sterilizationDate(LocalDate.now().minusDays(3))
                .expiryDate(LocalDate.now().plusDays(7))
                .operator("李四")
                .notes("灭菌正常")
                .build();
        sterilizationBatchRepository.save(batch);
        
        ReceiveRecord receiveRecord = ReceiveRecord.builder()
                .receiveNo("REC" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .department("手术室一")
                .result(ReceiveRecord.ReceiveResult.ACCEPTED)
                .operator("王五")
                .build();
        receiveRecordRepository.save(receiveRecord);
        
        ReviewRecord reviewRecord = ReviewRecord.builder()
                .reviewNo("REV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .result(ReviewRecord.ReviewResult.APPROVED)
                .operator("赵六")
                .notes("质控合格")
                .build();
        reviewRecordRepository.save(reviewRecord);
    }
    
    private void initMissingInstrumentPackage() {
        InstrumentPackage pkg = InstrumentPackage.builder()
                .packageCode("PKG-MISS-001")
                .packageName("骨科器械包")
                .status(InstrumentPackage.PackageStatus.ABNORMAL)
                .build();
        pkg = packageRepository.save(pkg);
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-004")
                .instrumentName("骨锯")
                .instrumentType("骨科器械")
                .specification("电动")
                .quantity(1)
                .unit("台")
                .instrumentPackage(pkg)
                .build());
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-005")
                .instrumentName("骨钻")
                .instrumentType("骨科器械")
                .specification("φ3.5")
                .quantity(1)
                .unit("台")
                .instrumentPackage(pkg)
                .build());
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-006")
                .instrumentName("骨钳")
                .instrumentType("骨科器械")
                .specification("大号")
                .quantity(2)
                .unit("把")
                .instrumentPackage(pkg)
                .build());
        
        InventoryRecord inventoryRecord = InventoryRecord.builder()
                .inventoryNo("INV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .actualQuantity(3)
                .expectedQuantity(4)
                .result(InventoryRecord.InventoryResult.MISSING)
                .operator("张三")
                .notes("骨钻缺失")
                .build();
        inventoryRecordRepository.save(inventoryRecord);
        
        AbnormalRecord abnormalRecord = AbnormalRecord.builder()
                .instrumentPackage(pkg)
                .abnormalType(AbnormalRecord.AbnormalType.INSTRUMENT_MISSING)
                .reason("骨钻缺失，已通知采购")
                .handler("张三")
                .resolveStatus(AbnormalRecord.ResolveStatus.PENDING)
                .build();
        abnormalRecordRepository.save(abnormalRecord);
    }
    
    private void initExpiredSterilizationPackage() {
        InstrumentPackage pkg = InstrumentPackage.builder()
                .packageCode("PKG-EXPI-001")
                .packageName("妇产科器械包")
                .status(InstrumentPackage.PackageStatus.ABNORMAL)
                .build();
        pkg = packageRepository.save(pkg);
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-007")
                .instrumentName("产钳")
                .instrumentType("妇产科器械")
                .specification("普通型")
                .quantity(1)
                .unit("套")
                .instrumentPackage(pkg)
                .build());
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-008")
                .instrumentName("吸引器")
                .instrumentType("妇产科器械")
                .specification("手动")
                .quantity(1)
                .unit("个")
                .instrumentPackage(pkg)
                .build());
        
        InventoryRecord inventoryRecord = InventoryRecord.builder()
                .inventoryNo("INV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .actualQuantity(2)
                .expectedQuantity(2)
                .result(InventoryRecord.InventoryResult.NORMAL)
                .operator("张三")
                .build();
        inventoryRecordRepository.save(inventoryRecord);
        
        SterilizationBatch batch = SterilizationBatch.builder()
                .batchNo("STE" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .sterilizerNo("STE-002")
                .sterilizationDate(LocalDate.now().minusDays(30))
                .expiryDate(LocalDate.now().minusDays(10))
                .operator("李四")
                .build();
        sterilizationBatchRepository.save(batch);
        
        AbnormalRecord abnormalRecord = AbnormalRecord.builder()
                .instrumentPackage(pkg)
                .abnormalType(AbnormalRecord.AbnormalType.EXPIRED_STERILIZATION)
                .reason("灭菌批次过期，需重新灭菌")
                .resolveStatus(AbnormalRecord.ResolveStatus.PENDING)
                .build();
        abnormalRecordRepository.save(abnormalRecord);
    }
    
    private void initReturnedPackage() {
        InstrumentPackage pkg = InstrumentPackage.builder()
                .packageCode("PKG-RET-001")
                .packageName("神经外科器械包")
                .status(InstrumentPackage.PackageStatus.RETURNED)
                .build();
        pkg = packageRepository.save(pkg);
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-009")
                .instrumentName("脑膜剪")
                .instrumentType("神经外科器械")
                .specification("显微")
                .quantity(2)
                .unit("把")
                .instrumentPackage(pkg)
                .build());
        
        instrumentRepository.save(Instrument.builder()
                .instrumentCode("INS-010")
                .instrumentName("脑压板")
                .instrumentType("神经外科器械")
                .specification("不锈钢")
                .quantity(2)
                .unit("个")
                .instrumentPackage(pkg)
                .build());
        
        InventoryRecord inventoryRecord = InventoryRecord.builder()
                .inventoryNo("INV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .actualQuantity(4)
                .expectedQuantity(4)
                .result(InventoryRecord.InventoryResult.NORMAL)
                .operator("张三")
                .build();
        inventoryRecordRepository.save(inventoryRecord);
        
        SterilizationBatch batch = SterilizationBatch.builder()
                .batchNo("STE" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .sterilizerNo("STE-001")
                .sterilizationDate(LocalDate.now().minusDays(5))
                .expiryDate(LocalDate.now().plusDays(5))
                .operator("李四")
                .build();
        sterilizationBatchRepository.save(batch);
        
        ReceiveRecord receiveRecord = ReceiveRecord.builder()
                .receiveNo("REC" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .department("手术室二")
                .result(ReceiveRecord.ReceiveResult.ACCEPTED)
                .operator("王五")
                .build();
        receiveRecordRepository.save(receiveRecord);
        
        ReviewRecord reviewRecord = ReviewRecord.builder()
                .reviewNo("REV" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .result(ReviewRecord.ReviewResult.APPROVED)
                .operator("赵六")
                .build();
        reviewRecordRepository.save(reviewRecord);
        
        IssueRecord issueRecord = IssueRecord.builder()
                .issueNo("ISS" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .instrumentPackage(pkg)
                .department("手术室二")
                .operator("孙七")
                .build();
        issueRecordRepository.save(issueRecord);
        
        AbnormalRecord abnormalRecord = AbnormalRecord.builder()
                .instrumentPackage(pkg)
                .abnormalType(AbnormalRecord.AbnormalType.RETURNED_FROM_OPERATING_ROOM)
                .reason("手术取消，器械包未使用")
                .handler("孙七")
                .resolveStatus(AbnormalRecord.ResolveStatus.PENDING)
                .build();
        abnormalRecordRepository.save(abnormalRecord);
    }
}