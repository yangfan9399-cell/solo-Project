package com.hotel.maintenance.config;

import com.hotel.maintenance.entity.*;
import com.hotel.maintenance.enums.*;
import com.hotel.maintenance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoomRepository roomRepository;
    private final EmployeeRepository employeeRepository;
    private final MaintenanceOrderRepository maintenanceOrderRepository;
    private final AuditNodeRepository auditNodeRepository;
    private final AffectedOrderRepository affectedOrderRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (roomRepository.count() > 0) {
            return;
        }

        initRooms();
        initEmployees();

        Employee receptionist = employeeRepository.findByRole(Role.RECEPTION).get(0);
        Employee engineer1 = employeeRepository.findByRole(Role.ENGINEER).get(0);
        Employee engineer2 = employeeRepository.findByRole(Role.ENGINEER).get(1);
        Employee housekeeper = employeeRepository.findByRole(Role.HOUSEKEEPING_SUPERVISOR).get(0);
        Employee manager = employeeRepository.findByRole(Role.DUTY_MANAGER).get(0);

        createSample1_NormalRestore(receptionist, engineer1, housekeeper, manager);
        createSample2_Overdue(receptionist, engineer2);
        createSample3_CleaningFailed(receptionist, engineer1, housekeeper);
        createSample4_ComplaintEscalated(receptionist, engineer2, housekeeper, manager);
    }

    private void initRooms() {
        String[] roomTypes = {"标准大床房", "标准双床房", "豪华大床房", "豪华套房", "行政套房"};
        double[] prices = {398, 428, 688, 1288, 1888};
        int[] capacities = {2, 2, 2, 3, 4};

        List<Room> rooms = new ArrayList<>();
        for (int floor = 3; floor <= 10; floor++) {
            for (int i = 0; i < 8; i++) {
                int typeIndex = (floor + i) % roomTypes.length;
                Room room = new Room();
                room.setRoomNumber(String.format("%d%02d", floor, i + 1));
                room.setFloor(floor);
                room.setRoomType(roomTypes[typeIndex]);
                room.setPricePerNight(prices[typeIndex]);
                room.setCapacity(capacities[typeIndex]);
                room.setStatus(RoomStatus.AVAILABLE);
                room.setLocation(floor + "楼" + (i < 4 ? "南侧" : "北侧"));
                rooms.add(room);
            }
        }
        roomRepository.saveAll(rooms);
    }

    private void initEmployees() {
        List<Employee> employees = new ArrayList<>();

        Employee e1 = new Employee();
        e1.setName("张小明");
        e1.setEmployeeNo("R001");
        e1.setRole(Role.RECEPTION);
        e1.setPhone("13800000001");
        e1.setDepartment("前厅部");
        employees.add(e1);

        Employee e2 = new Employee();
        e2.setName("李小红");
        e2.setEmployeeNo("R002");
        e2.setRole(Role.RECEPTION);
        e2.setPhone("13800000002");
        e2.setDepartment("前厅部");
        employees.add(e2);

        Employee e3 = new Employee();
        e3.setName("王大锤");
        e3.setEmployeeNo("E001");
        e3.setRole(Role.ENGINEER);
        e3.setPhone("13800000003");
        e3.setDepartment("工程部");
        employees.add(e3);

        Employee e4 = new Employee();
        e4.setName("刘铁牛");
        e4.setEmployeeNo("E002");
        e4.setRole(Role.ENGINEER);
        e4.setPhone("13800000004");
        e4.setDepartment("工程部");
        employees.add(e4);

        Employee e5 = new Employee();
        e5.setName("陈美丽");
        e5.setEmployeeNo("H001");
        e5.setRole(Role.HOUSEKEEPING_SUPERVISOR);
        e5.setPhone("13800000005");
        e5.setDepartment("客房部");
        employees.add(e5);

        Employee e6 = new Employee();
        e6.setName("赵芳华");
        e6.setEmployeeNo("H002");
        e6.setRole(Role.HOUSEKEEPING_SUPERVISOR);
        e6.setPhone("13800000006");
        e6.setDepartment("客房部");
        employees.add(e6);

        Employee e7 = new Employee();
        e7.setName("孙经理");
        e7.setEmployeeNo("M001");
        e7.setRole(Role.DUTY_MANAGER);
        e7.setPhone("13800000007");
        e7.setDepartment("前厅部");
        employees.add(e7);

        Employee e8 = new Employee();
        e8.setName("周总监");
        e8.setEmployeeNo("M002");
        e8.setRole(Role.DUTY_MANAGER);
        e8.setPhone("13800000008");
        e8.setDepartment("房务部");
        employees.add(e8);

        employeeRepository.saveAll(employees);
    }

    @Transactional
    public void createSample1_NormalRestore(Employee receptionist, Employee engineer, Employee housekeeper, Employee manager) {
        Room room = roomRepository.findByRoomNumber("503");
        room.setStatus(RoomStatus.AVAILABLE);
        roomRepository.save(room);

        LocalDateTime baseTime = LocalDateTime.now().minusDays(3);

        MaintenanceOrder order = new MaintenanceOrder();
        order.setOrderNo("MT-SAMPLE-001");
        order.setRoom(room);
        order.setFaultType(FaultType.HVAC);
        order.setFaultDescription("客人反映房间空调制冷效果差，检查发现压缩机故障，需要更换配件。房间温度持续偏高，无法正常入住。");
        order.setStatus(MaintenanceStatus.SUBMITTED);
        order.setReporter(receptionist);
        order.setEngineer(engineer);
        order.setHousekeeper(housekeeper);
        order.setReviewer(manager);
        order.setPriority(1);
        order.setComplaint(false);
        order.setOutOfServiceTime(baseTime);
        order.setCreatedAt(baseTime);
        order.setUpdatedAt(baseTime);

        order.setEstimatedRepairTime(baseTime.plusHours(8));
        order.setActualRepairStartTime(baseTime.plusMinutes(30));
        order.setActualRepairEndTime(baseTime.plusHours(6));
        order.setRepairReport("已更换空调压缩机，测试制冷正常，出风口温度达到16度。更换配件：压缩机1台，雪种3kg。");
        order.setCleaningCheckTime(baseTime.plusHours(7));
        order.setCleaningReport("房间清洁检查通过，维修现场已清理干净，床上用品已更换，卫生间消毒完毕。");
        order.setReviewTime(baseTime.plusHours(8));
        order.setReviewComment("维修完成，清洁通过，同意恢复售卖。");
        order.setRestoreTime(baseTime.plusHours(8));
        order.setStatus(MaintenanceStatus.RESTORED);

        room.setStatus(RoomStatus.AVAILABLE);
        roomRepository.save(room);
        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.SUBMITTED, receptionist, "前台提交故障，房间停卖。客人反映空调不制冷。", baseTime);
        addAuditNode(savedOrder, MaintenanceStatus.ASSIGNED, engineer, "已派工给王大锤，预计8小时内完成。", baseTime.plusMinutes(15));
        addAuditNode(savedOrder, MaintenanceStatus.IN_PROGRESS, engineer, "开始维修，检测发现压缩机损坏。", baseTime.plusMinutes(30));
        addAuditNode(savedOrder, MaintenanceStatus.COMPLETED, engineer, "维修完成，已更换压缩机，测试正常。", baseTime.plusHours(6));
        addAuditNode(savedOrder, MaintenanceStatus.CLEANING_PASSED, housekeeper, "清洁检查通过，房间已恢复整洁。", baseTime.plusHours(7));
        addAuditNode(savedOrder, MaintenanceStatus.RESTORED, manager, "复核通过，恢复房间售卖。", baseTime.plusHours(8));

        MaintenanceRecord record = new MaintenanceRecord();
        record.setMaintenanceOrder(savedOrder);
        record.setEngineer(engineer);
        record.setWorkStartTime(baseTime.plusMinutes(30));
        record.setWorkEndTime(baseTime.plusHours(6));
        record.setWorkDescription("更换空调压缩机，抽真空加雪种，测试运行正常。");
        record.setPartsUsed("压缩机1台，雪种3kg，密封垫2个");
        record.setLaborCost(300.0);
        record.setPartsCost(1800.0);
        record.setWorkStatus("已完成");
        record.setCreatedAt(baseTime.plusHours(6));
        maintenanceRecordRepository.save(record);

        AffectedOrder ao = new AffectedOrder();
        ao.setMaintenanceOrder(savedOrder);
        ao.setOrderNo("ORD-SAMPLE-001");
        ao.setGuestName("王先生");
        ao.setGuestPhone("13900001111");
        ao.setCheckInDate(LocalDate.now().minusDays(3));
        ao.setCheckOutDate(LocalDate.now().minusDays(1));
        ao.setOrderAmount(796.0);
        ao.setHandlingMethod("换房");
        ao.setCompensationAmount(0.0);
        ao.setRemark("已为客人升级到豪华大床房508，客人表示满意。");
        affectedOrderRepository.save(ao);
    }

    @Transactional
    public void createSample2_Overdue(Employee receptionist, Employee engineer) {
        Room room = roomRepository.findByRoomNumber("705");
        room.setStatus(RoomStatus.UNDER_REPAIR);
        roomRepository.save(room);

        LocalDateTime baseTime = LocalDateTime.now().minusDays(1);

        MaintenanceOrder order = new MaintenanceOrder();
        order.setOrderNo("MT-SAMPLE-002");
        order.setRoom(room);
        order.setFaultType(FaultType.PLUMBING);
        order.setFaultDescription("房间卫生间马桶底部漏水，地板有积水，需要拆除马桶重新安装防水。楼下605房间也出现渗水情况。");
        order.setStatus(MaintenanceStatus.OVERDUE);
        order.setReporter(receptionist);
        order.setEngineer(engineer);
        order.setPriority(2);
        order.setComplaint(false);
        order.setOutOfServiceTime(baseTime);
        order.setCreatedAt(baseTime);
        order.setUpdatedAt(baseTime);

        order.setEstimatedRepairTime(baseTime.plusHours(6));
        order.setActualRepairStartTime(baseTime.plusMinutes(45));
        order.setRepairReport("马桶底座漏水，已拆除马桶，发现法兰圈老化破损。需要重新做防水处理，目前正在等待防水胶干，预计还需要24小时。");

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.SUBMITTED, receptionist, "前台提交故障，马桶漏水严重，楼下也受影响。", baseTime);
        addAuditNode(savedOrder, MaintenanceStatus.ASSIGNED, engineer, "已派工给刘铁牛，预计6小时完成。", baseTime.plusMinutes(20));
        addAuditNode(savedOrder, MaintenanceStatus.IN_PROGRESS, engineer, "开始维修，拆除马桶发现防水失效。", baseTime.plusMinutes(45));
        addAuditNode(savedOrder, MaintenanceStatus.OVERDUE, engineer, "维修超期！防水处理需要更长时间，预计还需24小时才能恢复使用。", LocalDateTime.now());

        MaintenanceRecord record = new MaintenanceRecord();
        record.setMaintenanceOrder(savedOrder);
        record.setEngineer(engineer);
        record.setWorkStartTime(baseTime.plusMinutes(45));
        record.setWorkDescription("拆除马桶，清理旧防水层，涂刷新防水胶，目前正在晾干中。");
        record.setPartsUsed("法兰圈1个，防水涂料1桶");
        record.setLaborCost(200.0);
        record.setPartsCost(350.0);
        record.setWorkStatus("进行中");
        record.setCreatedAt(baseTime.plusHours(3));
        maintenanceRecordRepository.save(record);
    }

    @Transactional
    public void createSample3_CleaningFailed(Employee receptionist, Employee engineer, Employee housekeeper) {
        Room room = roomRepository.findByRoomNumber("602");
        room.setStatus(RoomStatus.CLEANING_PENDING);
        roomRepository.save(room);

        LocalDateTime baseTime = LocalDateTime.now().minusHours(12);

        MaintenanceOrder order = new MaintenanceOrder();
        order.setOrderNo("MT-SAMPLE-003");
        order.setRoom(room);
        order.setFaultType(FaultType.WALL_DECOR);
        order.setFaultDescription("房间墙面壁纸受潮起鼓，面积约2平米，位置在床头背景墙。疑似卫生间渗水导致。");
        order.setStatus(MaintenanceStatus.CLEANING_FAILED);
        order.setReporter(receptionist);
        order.setEngineer(engineer);
        order.setHousekeeper(housekeeper);
        order.setPriority(1);
        order.setComplaint(false);
        order.setOutOfServiceTime(baseTime);
        order.setCreatedAt(baseTime);
        order.setUpdatedAt(baseTime);

        order.setEstimatedRepairTime(baseTime.plusHours(10));
        order.setActualRepairStartTime(baseTime.plusMinutes(40));
        order.setActualRepairEndTime(baseTime.plusHours(8));
        order.setRepairReport("已拆除起鼓壁纸，重新做墙面防潮处理，铺贴新壁纸。已检查卫生间防水，未发现明显渗漏点，可能是湿度太大导致。");
        order.setCleaningCheckTime(baseTime.plusHours(9));
        order.setCleaningReport("清洁检查未通过！维修现场有壁纸胶残留气味，地板上有胶水痕迹，需要再次通风和清洁。床头板后方未清理干净，有碎纸屑。");

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.SUBMITTED, receptionist, "前台提交故障，墙面壁纸起鼓。", baseTime);
        addAuditNode(savedOrder, MaintenanceStatus.ASSIGNED, engineer, "已派工给王大锤，预计10小时完成。", baseTime.plusMinutes(15));
        addAuditNode(savedOrder, MaintenanceStatus.IN_PROGRESS, engineer, "开始维修，拆除旧壁纸，做防潮处理。", baseTime.plusMinutes(40));
        addAuditNode(savedOrder, MaintenanceStatus.COMPLETED, engineer, "维修完成，新壁纸已铺贴完毕。", baseTime.plusHours(8));
        addAuditNode(savedOrder, MaintenanceStatus.CLEANING_FAILED, housekeeper, "清洁检查未通过！有胶水残留和气味，需重新清洁并通风。", baseTime.plusHours(9));

        MaintenanceRecord record = new MaintenanceRecord();
        record.setMaintenanceOrder(savedOrder);
        record.setEngineer(engineer);
        record.setWorkStartTime(baseTime.plusMinutes(40));
        record.setWorkEndTime(baseTime.plusHours(8));
        record.setWorkDescription("墙面壁纸更换，做防潮处理。");
        record.setPartsUsed("壁纸3平米，防潮剂1瓶，壁纸胶1桶");
        record.setLaborCost(250.0);
        record.setPartsCost(420.0);
        record.setWorkStatus("已完成");
        record.setCreatedAt(baseTime.plusHours(8));
        maintenanceRecordRepository.save(record);
    }

    @Transactional
    public void createSample4_ComplaintEscalated(Employee receptionist, Employee engineer, Employee housekeeper, Employee manager) {
        Room room = roomRepository.findByRoomNumber("808");
        room.setStatus(RoomStatus.CLEANING_DONE);
        roomRepository.save(room);

        LocalDateTime baseTime = LocalDateTime.now().minusHours(8);

        MaintenanceOrder order = new MaintenanceOrder();
        order.setOrderNo("MT-SAMPLE-004");
        order.setRoom(room);
        order.setFaultType(FaultType.SECURITY);
        order.setFaultDescription("客人反映房间门锁刷卡失灵，多次尝试无法开门，导致客人在门外等待20分钟。客人非常不满，已经投诉到客服中心。");
        order.setStatus(MaintenanceStatus.COMPLAINT_ESCALATED);
        order.setReporter(receptionist);
        order.setEngineer(engineer);
        order.setHousekeeper(housekeeper);
        order.setReviewer(manager);
        order.setPriority(3);
        order.setComplaint(true);
        order.setComplaintDescription("客人李先生入住808房间，晚上22:30返回时无法刷卡开门，在走廊等待20分钟，期间多次致电前台未果。客人表示酒店服务差，要求全额退款并赔偿精神损失。此事已被客人发布到社交媒体，产生不良影响。");
        order.setOutOfServiceTime(baseTime);
        order.setCreatedAt(baseTime);
        order.setUpdatedAt(baseTime);

        order.setEstimatedRepairTime(baseTime.plusHours(3));
        order.setActualRepairStartTime(baseTime.plusMinutes(25));
        order.setActualRepairEndTime(baseTime.plusHours(2));
        order.setRepairReport("门锁电路板故障，已更换全新电路板和电池，测试刷卡正常。已检查门锁机械结构，确认无异常。");
        order.setCleaningCheckTime(baseTime.plusHours(3));
        order.setCleaningReport("清洁检查通过，维修现场已清理。");
        order.setReviewComment("待与客人沟通赔偿事宜后再决定是否恢复售卖。");

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.SUBMITTED, receptionist, "前台提交故障，门锁刷卡失灵，客人已投诉。", baseTime);
        addAuditNode(savedOrder, MaintenanceStatus.ASSIGNED, engineer, "紧急派工给刘铁牛，3小时内必须完成。", baseTime.plusMinutes(10));
        addAuditNode(savedOrder, MaintenanceStatus.IN_PROGRESS, engineer, "开始维修，检测发现电路板烧毁。", baseTime.plusMinutes(25));
        addAuditNode(savedOrder, MaintenanceStatus.COMPLETED, engineer, "维修完成，已更换电路板，测试正常。", baseTime.plusHours(2));
        addAuditNode(savedOrder, MaintenanceStatus.CLEANING_PASSED, housekeeper, "清洁检查通过。", baseTime.plusHours(3));
        addAuditNode(savedOrder, MaintenanceStatus.COMPLAINT_ESCALATED, manager, "客诉已升级！客人要求赔偿，待协商处理方案。", baseTime.plusHours(4));

        MaintenanceRecord record = new MaintenanceRecord();
        record.setMaintenanceOrder(savedOrder);
        record.setEngineer(engineer);
        record.setWorkStartTime(baseTime.plusMinutes(25));
        record.setWorkEndTime(baseTime.plusHours(2));
        record.setWorkDescription("更换门锁电路板，调试刷卡系统。");
        record.setPartsUsed("电路板1块，电池4节");
        record.setLaborCost(150.0);
        record.setPartsCost(580.0);
        record.setWorkStatus("已完成");
        record.setCreatedAt(baseTime.plusHours(2));
        maintenanceRecordRepository.save(record);

        AffectedOrder ao1 = new AffectedOrder();
        ao1.setMaintenanceOrder(savedOrder);
        ao1.setOrderNo("ORD-SAMPLE-004A");
        ao1.setGuestName("李先生");
        ao1.setGuestPhone("13800008888");
        ao1.setCheckInDate(LocalDate.now().minusDays(1));
        ao1.setCheckOutDate(LocalDate.now().plusDays(1));
        ao1.setOrderAmount(3776.0);
        ao1.setHandlingMethod("其他");
        ao1.setCompensationAmount(0.0);
        ao1.setRemark("客人要求全额退款3776元 + 赔偿精神损失5000元，正在协商中。");
        affectedOrderRepository.save(ao1);

        AffectedOrder ao2 = new AffectedOrder();
        ao2.setMaintenanceOrder(savedOrder);
        ao2.setOrderNo("ORD-SAMPLE-004B");
        ao2.setGuestName("张女士");
        ao2.setGuestPhone("13900009999");
        ao2.setCheckInDate(LocalDate.now().plusDays(2));
        ao2.setCheckOutDate(LocalDate.now().plusDays(4));
        ao2.setOrderAmount(2576.0);
        ao2.setHandlingMethod("换房");
        ao2.setCompensationAmount(0.0);
        ao2.setRemark("已为预订客人更换至809行政套房，不额外收费。");
        affectedOrderRepository.save(ao2);
    }

    private void addAuditNode(MaintenanceOrder order, MaintenanceStatus status, Employee operator, String comment, LocalDateTime time) {
        AuditNode node = new AuditNode();
        node.setMaintenanceOrder(order);
        node.setStatus(status);
        node.setOperatorRole(operator.getRole());
        node.setOperator(operator);
        node.setComment(comment);
        node.setCreatedAt(time);
        auditNodeRepository.save(node);
    }
}
