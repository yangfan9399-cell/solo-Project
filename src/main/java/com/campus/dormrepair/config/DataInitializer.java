package com.campus.dormrepair.config;

import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.entity.RepairHistory;
import com.campus.dormrepair.entity.RepairPart;
import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.FaultType;
import com.campus.dormrepair.enums.RepairStatus;
import com.campus.dormrepair.enums.SatisfactionLevel;
import com.campus.dormrepair.enums.TimeoutReason;
import com.campus.dormrepair.enums.UserRole;
import com.campus.dormrepair.repository.RepairHistoryRepository;
import com.campus.dormrepair.repository.RepairPartRepository;
import com.campus.dormrepair.repository.RepairRepository;
import com.campus.dormrepair.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RepairRepository repairRepository;

    @Autowired
    private RepairHistoryRepository historyRepository;

    @Autowired
    private RepairPartRepository partRepository;

    @Override
    public void run(String... args) {
        initUsers();
        initSampleRepairs();
    }

    private void initUsers() {
        if (userRepository.count() > 0) return;

        User s1 = new User(null, "student1", "张三", "13800138001", UserRole.STUDENT, "计算机学院");
        User s2 = new User(null, "student2", "李四", "13800138002", UserRole.STUDENT, "电子工程学院");
        User s3 = new User(null, "student3", "王五", "13800138003", UserRole.STUDENT, "机械工程学院");
        User s4 = new User(null, "student4", "赵六", "13800138004", UserRole.STUDENT, "文学院");
        userRepository.save(s1);
        userRepository.save(s2);
        userRepository.save(s3);
        userRepository.save(s4);

        User dm1 = new User(null, "dorm1", "刘宿管", "13900139001", UserRole.DORM_MANAGER, "学生宿舍1-3栋");
        User dm2 = new User(null, "dorm2", "陈宿管", "13900139002", UserRole.DORM_MANAGER, "学生宿舍4-6栋");
        userRepository.save(dm1);
        userRepository.save(dm2);

        User r1 = new User(null, "repair1", "王师傅", "13700137001", UserRole.REPAIRMAN, "水电维修组");
        User r2 = new User(null, "repair2", "李师傅", "13700137002", UserRole.REPAIRMAN, "综合维修组");
        User r3 = new User(null, "repair3", "张师傅", "13700137003", UserRole.REPAIRMAN, "木工家具组");
        userRepository.save(r1);
        userRepository.save(r2);
        userRepository.save(r3);

        User sv1 = new User(null, "super1", "周主管", "13600136001", UserRole.LOGISTICS_SUPERVISOR, "后勤管理处");
        userRepository.save(sv1);
    }

    private void initSampleRepairs() {
        if (repairRepository.count() > 0) return;

        User s1 = userRepository.findByUsername("student1").orElseThrow();
        User s2 = userRepository.findByUsername("student2").orElseThrow();
        User s3 = userRepository.findByUsername("student3").orElseThrow();
        User s4 = userRepository.findByUsername("student4").orElseThrow();
        User dm1 = userRepository.findByUsername("dorm1").orElseThrow();
        User dm2 = userRepository.findByUsername("dorm2").orElseThrow();
        User r1 = userRepository.findByUsername("repair1").orElseThrow();
        User r2 = userRepository.findByUsername("repair2").orElseThrow();
        User r3 = userRepository.findByUsername("repair3").orElseThrow();
        User sv1 = userRepository.findByUsername("super1").orElseThrow();

        createNormalClosedRepair(s1, dm1, r1, sv1, "1号楼", "201",
                FaultType.PLUMBING, "水龙头漏水，滴水不止", 45,
                SatisfactionLevel.VERY_SATISFIED, "维修及时，服务态度好");

        createNormalClosedRepair(s2, dm2, r3, sv1, "4号楼", "305",
                FaultType.FURNITURE, "书桌抽屉滑轨损坏，无法推拉", 80,
                SatisfactionLevel.SATISFIED, "维修质量不错");

        createNormalClosedRepair(s3, dm1, r2, sv1, "2号楼", "402",
                FaultType.DOOR_LOCK, "门锁损坏，无法正常开关", 35,
                SatisfactionLevel.VERY_SATISFIED, "师傅很专业，很快就修好了");

        createNormalClosedRepair(s4, dm2, r1, sv1, "5号楼", "208",
                FaultType.APPLIANCE, "电风扇不转了", 50,
                SatisfactionLevel.SATISFIED, "整体满意");

        createNormalClosedRepair(s1, dm1, r3, sv1, "3号楼", "306",
                FaultType.WINDOW, "窗户把手坏了", 25,
                SatisfactionLevel.VERY_SATISFIED, "非常满意");

        createNormalClosedRepair(s2, dm2, r2, sv1, "6号楼", "101",
                FaultType.NETWORK, "网络接口坏了", 40,
                SatisfactionLevel.NEUTRAL, "一般般");

        createNormalClosedRepair(s3, dm1, r1, sv1, "1号楼", "503",
                FaultType.PLUMBING, "厕所冲水阀坏了", 55,
                SatisfactionLevel.SATISFIED, "还不错");

        createTimeoutRepair(s3, dm1, r2, sv1, "2号楼", "108",
                FaultType.APPLIANCE, "空调不制冷，怀疑缺少冷媒",
                TimeoutReason.PARTS_DELAY, "冷媒缺货，正在采购中", 180);

        createTimeoutRepair(s4, dm2, r3, sv1, "5号楼", "505",
                FaultType.FURNITURE, "床架松动，摇晃严重",
                TimeoutReason.PERSONNEL_SHORTAGE, "维修人员不足，需排队等待", 0);

        createPartsShortageRepair(s4, dm2, r1, sv1, "5号楼", "402",
                FaultType.PLUMBING, "淋浴花洒开关损坏，无法调节水温",
                "恒温阀芯配件缺货，需要从厂家调货");

        createDissatisfiedRepair(s1, dm1, r2, sv1, "3号楼", "501",
                FaultType.DOOR_LOCK, "门锁不灵敏，刷卡有时没反应",
                "维修后还是经常失灵，问题没有根本解决", 30);

        createSubmittedRepair(s2, "2号楼", "203",
                FaultType.WINDOW, "窗户密封条老化，下雨天漏水");

        createAssignedRepair(s3, dm1, r3, "1号楼", "308",
                FaultType.NETWORK, "宿舍网线接口损坏，无法上网");

        createInProgressRepair(s4, dm2, r1, "6号楼", "601",
                FaultType.PLUMBING, "下水道堵塞，排水困难");

        createCompletedRepair(s1, dm1, r2, sv1, "3号楼", "102",
                FaultType.OTHER, "宿舍窗帘轨道脱落", 60);
    }

    private void createNormalClosedRepair(User student, User dormManager, User repairman,
                                           User supervisor, String building, String roomNo,
                                           FaultType faultType, String description,
                                           long repairMinutes, SatisfactionLevel satisfaction,
                                           String reviewComment) {
        LocalDateTime submitTime = LocalDateTime.now().minusDays(5).minusHours(2);
        LocalDateTime assignTime = submitTime.plusMinutes(30);
        LocalDateTime startTime = assignTime.plusHours(1);
        LocalDateTime completeTime = startTime.plusMinutes(repairMinutes);
        LocalDateTime reviewTime = completeTime.plusHours(2);
        LocalDateTime closeTime = reviewTime.plusMinutes(10);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "N");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.CLOSED);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setRepairNote("已修复，测试正常");
        repair.setPartsUsed("维修配件若干");
        repair.setReviewer(supervisor);
        repair.setSatisfaction(satisfaction);
        repair.setReviewComment(reviewComment);
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair.setStartTime(startTime);
        repair.setCompleteTime(completeTime);
        repair.setReviewTime(reviewTime);
        repair.setCloseTime(closeTime);
        repair.setRepairDurationMinutes(repairMinutes);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修", startTime);
        addHistory(repair, RepairStatus.COMPLETED, repairman.getRealName(),
                "维修完成，备注：已修复，测试正常", completeTime);
        addHistory(repair, RepairStatus.REVIEWED, supervisor.getRealName(),
                "回访确认，评价：" + satisfaction.getLabel() + "，意见：" + reviewComment, reviewTime);
        addHistory(repair, RepairStatus.CLOSED, supervisor.getRealName(), "报修已关闭", closeTime);

        RepairPart part = new RepairPart();
        part.setRepair(repair);
        part.setPartName("密封胶垫");
        part.setQuantity(2);
        part.setUnit("个");
        partRepository.save(part);
    }

    private void createTimeoutRepair(User student, User dormManager, User repairman,
                                      User supervisor, String building, String roomNo,
                                      FaultType faultType, String description,
                                      TimeoutReason reason, String detail, long repairMinutes) {
        LocalDateTime submitTime = LocalDateTime.now().minusDays(3).minusHours(5);
        LocalDateTime assignTime = submitTime.plusMinutes(40);
        LocalDateTime startTime = assignTime.plusHours(2);
        LocalDateTime timeoutTime = startTime.plusMinutes(180);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "T");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.TIMEOUT);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setTimeoutReason(reason);
        repair.setTimeoutDetail(detail);
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair.setStartTime(startTime);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修", startTime);
        addHistory(repair, RepairStatus.TIMEOUT, supervisor.getRealName(),
                "维修超时，原因：" + reason.getLabel() + "，详情：" + detail, timeoutTime);
    }

    private void createPartsShortageRepair(User student, User dormManager, User repairman,
                                            User supervisor, String building, String roomNo,
                                            FaultType faultType, String description,
                                            String shortageRemark) {
        LocalDateTime submitTime = LocalDateTime.now().minusDays(2).minusHours(8);
        LocalDateTime assignTime = submitTime.plusMinutes(50);
        LocalDateTime startTime = assignTime.plusHours(3);
        LocalDateTime shortageTime = startTime.plusMinutes(25);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "P");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.PARTS_SHORTAGE);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair.setStartTime(startTime);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修", startTime);
        addHistory(repair, RepairStatus.PARTS_SHORTAGE, repairman.getRealName(),
                "配件缺货：" + shortageRemark, shortageTime);
    }

    private void createDissatisfiedRepair(User student, User dormManager, User repairman,
                                           User supervisor, String building, String roomNo,
                                           FaultType faultType, String description,
                                           String reviewComment, long repairMinutes) {
        LocalDateTime submitTime = LocalDateTime.now().minusDays(4).minusHours(3);
        LocalDateTime assignTime = submitTime.plusMinutes(35);
        LocalDateTime startTime = assignTime.plusHours(1).plusMinutes(30);
        LocalDateTime completeTime = startTime.plusMinutes(repairMinutes);
        LocalDateTime reviewTime = completeTime.plusDays(1);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "D");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.DISSATISFIED);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setRepairNote("已调整锁具位置，清洁锁舌");
        repair.setReviewer(supervisor);
        repair.setSatisfaction(SatisfactionLevel.DISSATISFIED);
        repair.setReviewComment(reviewComment);
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair.setStartTime(startTime);
        repair.setCompleteTime(completeTime);
        repair.setReviewTime(reviewTime);
        repair.setRepairDurationMinutes(repairMinutes);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修", startTime);
        addHistory(repair, RepairStatus.COMPLETED, repairman.getRealName(),
                "维修完成，备注：已调整锁具位置，清洁锁舌", completeTime);
        addHistory(repair, RepairStatus.DISSATISFIED, supervisor.getRealName(),
                "回访不满意，评价：不满意，意见：" + reviewComment, reviewTime);
    }

    private void createSubmittedRepair(User student, String building, String roomNo,
                                        FaultType faultType, String description) {
        LocalDateTime submitTime = LocalDateTime.now().minusHours(2);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "S");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.SUBMITTED);
        repair.setSubmitTime(submitTime);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
    }

    private void createAssignedRepair(User student, User dormManager, User repairman,
                                       String building, String roomNo,
                                       FaultType faultType, String description) {
        LocalDateTime submitTime = LocalDateTime.now().minusHours(5);
        LocalDateTime assignTime = submitTime.plusMinutes(45);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "A");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.ASSIGNED);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
    }

    private void createInProgressRepair(User student, User dormManager, User repairman,
                                         String building, String roomNo,
                                         FaultType faultType, String description) {
        LocalDateTime submitTime = LocalDateTime.now().minusDays(1).minusHours(3);
        LocalDateTime assignTime = submitTime.plusMinutes(25);
        LocalDateTime startTime = assignTime.plusHours(2);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "I");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.IN_PROGRESS);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair.setStartTime(startTime);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修", startTime);
    }

    private void createCompletedRepair(User student, User dormManager, User repairman,
                                        User supervisor, String building, String roomNo,
                                        FaultType faultType, String description,
                                        long repairMinutes) {
        LocalDateTime submitTime = LocalDateTime.now().minusDays(1).minusHours(8);
        LocalDateTime assignTime = submitTime.plusMinutes(30);
        LocalDateTime startTime = assignTime.plusHours(1).plusMinutes(20);
        LocalDateTime completeTime = startTime.plusMinutes(repairMinutes);

        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.nanoTime() + "C");
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(student.getRealName());
        repair.setStudentPhone(student.getPhone());
        repair.setStatus(RepairStatus.COMPLETED);
        repair.setDormManager(dormManager);
        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setRepairNote("已重新安装窗帘轨道，加固固定");
        repair.setPartsUsed("膨胀螺丝4个，轨道1根");
        repair.setSubmitTime(submitTime);
        repair.setAssignTime(assignTime);
        repair.setStartTime(startTime);
        repair.setCompleteTime(completeTime);
        repair.setRepairDurationMinutes(repairMinutes);
        repair = repairRepository.save(repair);

        addHistory(repair, RepairStatus.SUBMITTED, student.getRealName(), "学生提交报修", submitTime);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName(), assignTime);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修", startTime);
        addHistory(repair, RepairStatus.COMPLETED, repairman.getRealName(),
                "维修完成，备注：已重新安装窗帘轨道，加固固定", completeTime);

        RepairPart part1 = new RepairPart();
        part1.setRepair(repair);
        part1.setPartName("窗帘轨道");
        part1.setQuantity(1);
        part1.setUnit("根");
        partRepository.save(part1);

        RepairPart part2 = new RepairPart();
        part2.setRepair(repair);
        part2.setPartName("膨胀螺丝");
        part2.setQuantity(4);
        part2.setUnit("个");
        partRepository.save(part2);
    }

    private void addHistory(Repair repair, RepairStatus status, String operatorName,
                            String remark, LocalDateTime time) {
        RepairHistory history = new RepairHistory();
        history.setRepair(repair);
        history.setStatus(status);
        history.setOperatorName(operatorName);
        history.setRemark(remark);
        history.setOperateTime(time);
        historyRepository.save(history);
    }
}
