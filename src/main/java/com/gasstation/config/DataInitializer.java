package com.gasstation.config;

import com.gasstation.entity.*;
import com.gasstation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private OilProductRepository oilProductRepository;

    @Autowired
    private TankRepository tankRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    @Autowired
    private InventoryHistoryRepository historyRepository;

    @Override
    public void run(String... args) {
        initStations();
        initOilProducts();
        initTanks();
        initUsers();
        initDeliveryOrders();
        initInventoryRecords();
    }

    private void initStations() {
        if (stationRepository.count() > 0) return;

        Station station1 = new Station();
        station1.setStationCode("ST001");
        station1.setStationName("城东路加油站");
        station1.setAddress("城东路128号");
        station1.setPhone("021-88880001");
        stationRepository.save(station1);

        Station station2 = new Station();
        station2.setStationCode("ST002");
        station2.setStationName("西环路加油站");
        station2.setAddress("西环路56号");
        station2.setPhone("021-88880002");
        stationRepository.save(station2);

        Station station3 = new Station();
        station3.setStationCode("ST003");
        station3.setStationName("南港路加油站");
        station3.setAddress("南港路200号");
        station3.setPhone("021-88880003");
        stationRepository.save(station3);
    }

    private void initOilProducts() {
        if (oilProductRepository.count() > 0) return;

        OilProduct p1 = new OilProduct();
        p1.setProductCode("92#");
        p1.setProductName("92号汽油");
        p1.setDensity(new BigDecimal("0.725"));
        p1.setDescription("国VI B标准");
        oilProductRepository.save(p1);

        OilProduct p2 = new OilProduct();
        p2.setProductCode("95#");
        p2.setProductName("95号汽油");
        p2.setDensity(new BigDecimal("0.737"));
        p2.setDescription("国VI B标准");
        oilProductRepository.save(p2);

        OilProduct p3 = new OilProduct();
        p3.setProductCode("0#");
        p3.setProductName("0号柴油");
        p3.setDensity(new BigDecimal("0.835"));
        p3.setDescription("国VI标准");
        oilProductRepository.save(p3);
    }

    private void initTanks() {
        if (tankRepository.count() > 0) return;

        Station station1 = stationRepository.findByStationCode("ST001");
        Station station2 = stationRepository.findByStationCode("ST002");
        OilProduct p92 = oilProductRepository.findByProductCode("92#");
        OilProduct p95 = oilProductRepository.findByProductCode("95#");
        OilProduct p0 = oilProductRepository.findByProductCode("0#");

        Tank t1 = new Tank();
        t1.setTankCode("T101");
        t1.setTankName("1号罐");
        t1.setCapacity(new BigDecimal("30000"));
        t1.setStation(station1);
        t1.setOilProduct(p92);
        t1.setGaugeStatus(true);
        t1.setRemark("92号汽油罐");
        tankRepository.save(t1);

        Tank t2 = new Tank();
        t2.setTankCode("T102");
        t2.setTankName("2号罐");
        t2.setCapacity(new BigDecimal("30000"));
        t2.setStation(station1);
        t2.setOilProduct(p95);
        t2.setGaugeStatus(true);
        t2.setRemark("95号汽油罐");
        tankRepository.save(t2);

        Tank t3 = new Tank();
        t3.setTankCode("T103");
        t3.setTankName("3号罐");
        t3.setCapacity(new BigDecimal("40000"));
        t3.setStation(station1);
        t3.setOilProduct(p0);
        t3.setGaugeStatus(false);
        t3.setRemark("0号柴油罐，液位仪故障待修");
        tankRepository.save(t3);

        Tank t4 = new Tank();
        t4.setTankCode("T201");
        t4.setTankName("1号罐");
        t4.setCapacity(new BigDecimal("25000"));
        t4.setStation(station2);
        t4.setOilProduct(p92);
        t4.setGaugeStatus(true);
        t4.setRemark("92号汽油罐");
        tankRepository.save(t4);

        Tank t5 = new Tank();
        t5.setTankCode("T202");
        t5.setTankName("2号罐");
        t5.setCapacity(new BigDecimal("25000"));
        t5.setStation(station2);
        t5.setOilProduct(p95);
        t5.setGaugeStatus(true);
        t5.setRemark("95号汽油罐");
        tankRepository.save(t5);
    }

    private void initUsers() {
        if (userRepository.count() > 0) return;

        Station station1 = stationRepository.findByStationCode("ST001");

        User u1 = new User();
        u1.setUsername("zhangsan");
        u1.setRealName("张三");
        u1.setRole(UserRole.STATION_MANAGER);
        u1.setStation(station1);
        u1.setPhone("13800000001");
        userRepository.save(u1);

        User u2 = new User();
        u2.setUsername("lisi");
        u2.setRealName("李四");
        u2.setRole(UserRole.GAUGER);
        u2.setStation(station1);
        u2.setPhone("13800000002");
        userRepository.save(u2);

        User u3 = new User();
        u3.setUsername("wangwu");
        u3.setRealName("王五");
        u3.setRole(UserRole.REGIONAL_SUPERVISOR);
        u3.setPhone("13800000003");
        userRepository.save(u3);
    }

    private void initDeliveryOrders() {
        if (deliveryOrderRepository.count() > 0) return;

        Tank t101 = tankRepository.findByTankCode("T101");
        Tank t102 = tankRepository.findByTankCode("T102");
        Tank t103 = tankRepository.findByTankCode("T103");
        OilProduct p92 = oilProductRepository.findByProductCode("92#");
        OilProduct p95 = oilProductRepository.findByProductCode("95#");
        OilProduct p0 = oilProductRepository.findByProductCode("0#");

        DeliveryOrder d1 = new DeliveryOrder();
        d1.setDeliveryNo("D20240601001");
        d1.setTank(t101);
        d1.setOilProduct(p92);
        d1.setDeliveryVolume(new BigDecimal("15000"));
        d1.setActualVolume(new BigDecimal("14980"));
        d1.setDeliveryDate(LocalDate.now().minusDays(2));
        d1.setCarrier("中石化运输公司");
        deliveryOrderRepository.save(d1);

        DeliveryOrder d2 = new DeliveryOrder();
        d2.setDeliveryNo("D20240601002");
        d2.setTank(t102);
        d2.setOilProduct(p95);
        d2.setDeliveryVolume(new BigDecimal("12000"));
        d2.setActualVolume(new BigDecimal("11980"));
        d2.setDeliveryDate(LocalDate.now().minusDays(1));
        d2.setCarrier("中石化运输公司");
        deliveryOrderRepository.save(d2);

        DeliveryOrder d3 = new DeliveryOrder();
        d3.setDeliveryNo("D20240601003");
        d3.setTank(t103);
        d3.setOilProduct(p0);
        d3.setDeliveryVolume(new BigDecimal("20000"));
        d3.setActualVolume(new BigDecimal("19500"));
        d3.setDeliveryDate(LocalDate.now().minusDays(3));
        d3.setCarrier("中石化运输公司");
        d3.setRemark("配送量差异较大，待确认");
        deliveryOrderRepository.save(d3);
    }

    private void initInventoryRecords() {
        if (inventoryRecordRepository.count() > 0) return;

        Tank t101 = tankRepository.findByTankCode("T101");
        Tank t102 = tankRepository.findByTankCode("T102");
        Tank t103 = tankRepository.findByTankCode("T103");
        Tank t201 = tankRepository.findByTankCode("T201");
        Station station1 = stationRepository.findByStationCode("ST001");
        Station station2 = stationRepository.findByStationCode("ST002");
        OilProduct p92 = oilProductRepository.findByProductCode("92#");
        OilProduct p95 = oilProductRepository.findByProductCode("95#");
        OilProduct p0 = oilProductRepository.findByProductCode("0#");

        InventoryRecord r1 = new InventoryRecord();
        r1.setRecordNo("PD" + LocalDate.now().minusDays(3).toString().replace("-", "") + "0001");
        r1.setTank(t101);
        r1.setStation(station1);
        r1.setOilProduct(p92);
        r1.setInventoryDate(LocalDate.now().minusDays(3));
        r1.setOpeningVolume(new BigDecimal("18500"));
        r1.setDeliveryVolume(new BigDecimal("15000"));
        r1.setSalesVolume(new BigDecimal("8200"));
        r1.setGaugeVolume(new BigDecimal("25260"));
        r1.setTheoreticalVolume(new BigDecimal("25300"));
        r1.setDifferenceVolume(new BigDecimal("-40"));
        r1.setLossRate(new BigDecimal("0.0016"));
        r1.setWaterLevel(new BigDecimal("5"));
        r1.setTemperature(new BigDecimal("22.5"));
        r1.setGaugeNormal(true);
        r1.setDiscrepancyType(DiscrepancyType.NORMAL);
        r1.setStatus(InventoryStatus.ARCHIVED);
        r1.setStationManager("张三");
        r1.setGauger("李四");
        r1.setSupervisor("王五");
        r1.setStationRemark("日盘点正常");
        r1.setGaugerRemark("数据复核无误");
        r1.setSupervisorRemark("正常归档");
        r1.setCreateTime(LocalDateTime.now().minusDays(3));
        r1.setUpdateTime(LocalDateTime.now().minusDays(2));
        inventoryRecordRepository.save(r1);
        addHistoryRecord(r1, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(3));
        addHistoryRecord(r1, InventoryStatus.PENDING_DISPOSAL, "李四", UserRole.GAUGER,
                "计量员复核通过，提交待处置", LocalDateTime.now().minusDays(3).plusHours(2));
        addHistoryRecord(r1, InventoryStatus.ARCHIVED, "王五", UserRole.REGIONAL_SUPERVISOR,
                "区域主管归档，备注：正常归档", LocalDateTime.now().minusDays(2));

        InventoryRecord r2 = new InventoryRecord();
        r2.setRecordNo("PD" + LocalDate.now().minusDays(2).toString().replace("-", "") + "0002");
        r2.setTank(t102);
        r2.setStation(station1);
        r2.setOilProduct(p95);
        r2.setInventoryDate(LocalDate.now().minusDays(2));
        r2.setOpeningVolume(new BigDecimal("16200"));
        r2.setDeliveryVolume(new BigDecimal("12000"));
        r2.setSalesVolume(new BigDecimal("6500"));
        r2.setGaugeVolume(new BigDecimal("21580"));
        r2.setTheoreticalVolume(new BigDecimal("21700"));
        r2.setDifferenceVolume(new BigDecimal("-120"));
        r2.setLossRate(new BigDecimal("0.0055"));
        r2.setWaterLevel(new BigDecimal("8"));
        r2.setTemperature(new BigDecimal("21.8"));
        r2.setGaugeNormal(true);
        r2.setDiscrepancyType(DiscrepancyType.EXCESS_LOSS);
        r2.setStatus(InventoryStatus.PENDING_DISPOSAL);
        r2.setStationManager("张三");
        r2.setGauger("李四");
        r2.setStationRemark("损耗偏大，可能有渗漏");
        r2.setGaugerRemark("损耗率0.55%，超阈值0.3%，请主管处置");
        r2.setCreateTime(LocalDateTime.now().minusDays(2));
        r2.setUpdateTime(LocalDateTime.now().minusDays(1));
        inventoryRecordRepository.save(r2);
        addHistoryRecord(r2, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(2));
        addHistoryRecord(r2, InventoryStatus.PENDING_DISPOSAL, "李四", UserRole.GAUGER,
                "计量员复核通过，提交待处置，损耗超标", LocalDateTime.now().minusDays(1));

        InventoryRecord r3 = new InventoryRecord();
        r3.setRecordNo("PD" + LocalDate.now().minusDays(1).toString().replace("-", "") + "0003");
        r3.setTank(t103);
        r3.setStation(station1);
        r3.setOilProduct(p0);
        r3.setInventoryDate(LocalDate.now().minusDays(1));
        r3.setOpeningVolume(new BigDecimal("22000"));
        r3.setDeliveryVolume(new BigDecimal("20000"));
        r3.setSalesVolume(new BigDecimal("5500"));
        r3.setGaugeVolume(new BigDecimal("36000"));
        r3.setTheoreticalVolume(new BigDecimal("36500"));
        r3.setDifferenceVolume(new BigDecimal("-500"));
        r3.setLossRate(new BigDecimal("0.0137"));
        r3.setWaterLevel(new BigDecimal("20"));
        r3.setTemperature(new BigDecimal("20.0"));
        r3.setGaugeNormal(false);
        r3.setDiscrepancyType(DiscrepancyType.GAUGE_ERROR);
        r3.setStatus(InventoryStatus.INVESTIGATING);
        r3.setStationManager("张三");
        r3.setGauger("李四");
        r3.setSupervisor("王五");
        r3.setStationRemark("液位仪显示异常，读数波动大");
        r3.setGaugerRemark("液位仪故障，数据仅供参考，建议检修");
        r3.setSupervisorRemark("已安排维修，追查中");
        r3.setCreateTime(LocalDateTime.now().minusDays(1));
        r3.setUpdateTime(LocalDateTime.now().minusHours(12));
        inventoryRecordRepository.save(r3);
        addHistoryRecord(r3, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(1));
        addHistoryRecord(r3, InventoryStatus.PENDING_DISPOSAL, "李四", UserRole.GAUGER,
                "计量员复核，液位仪异常，提交处置", LocalDateTime.now().minusDays(1).plusHours(3));
        addHistoryRecord(r3, InventoryStatus.INVESTIGATING, "王五", UserRole.REGIONAL_SUPERVISOR,
                "区域主管决定追查，已安排维修", LocalDateTime.now().minusHours(12));

        InventoryRecord r4 = new InventoryRecord();
        r4.setRecordNo("PD" + LocalDate.now().toString().replace("-", "") + "0004");
        r4.setTank(t101);
        r4.setStation(station1);
        r4.setOilProduct(p92);
        r4.setInventoryDate(LocalDate.now());
        r4.setOpeningVolume(new BigDecimal("25260"));
        r4.setDeliveryVolume(new BigDecimal("0"));
        r4.setSalesVolume(new BigDecimal("7800"));
        r4.setGaugeVolume(new BigDecimal("17390"));
        r4.setTheoreticalVolume(new BigDecimal("17460"));
        r4.setDifferenceVolume(new BigDecimal("-70"));
        r4.setLossRate(new BigDecimal("0.0040"));
        r4.setWaterLevel(new BigDecimal("6"));
        r4.setTemperature(new BigDecimal("23.2"));
        r4.setGaugeNormal(true);
        r4.setDiscrepancyType(DiscrepancyType.DELIVERY_MISMATCH);
        r4.setStatus(InventoryStatus.PENDING_REVIEW);
        r4.setStationManager("张三");
        r4.setStationRemark("昨日配送量核对有差异，今日继续观察");
        r4.setCreateTime(LocalDateTime.now().minusHours(2));
        r4.setUpdateTime(LocalDateTime.now().minusHours(2));
        inventoryRecordRepository.save(r4);
        addHistoryRecord(r4, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusHours(2));

        InventoryRecord r5 = new InventoryRecord();
        r5.setRecordNo("PD" + LocalDate.now().minusDays(2).toString().replace("-", "") + "0005");
        r5.setTank(t201);
        r5.setStation(station2);
        r5.setOilProduct(p92);
        r5.setInventoryDate(LocalDate.now().minusDays(2));
        r5.setOpeningVolume(new BigDecimal("15800"));
        r5.setDeliveryVolume(new BigDecimal("10000"));
        r5.setSalesVolume(new BigDecimal("6200"));
        r5.setGaugeVolume(new BigDecimal("19550"));
        r5.setTheoreticalVolume(new BigDecimal("19600"));
        r5.setDifferenceVolume(new BigDecimal("-50"));
        r5.setLossRate(new BigDecimal("0.0026"));
        r5.setWaterLevel(new BigDecimal("4"));
        r5.setTemperature(new BigDecimal("22.0"));
        r5.setGaugeNormal(true);
        r5.setDiscrepancyType(DiscrepancyType.NORMAL);
        r5.setStatus(InventoryStatus.ADJUSTED);
        r5.setStationManager("赵六");
        r5.setGauger("钱七");
        r5.setSupervisor("王五");
        r5.setStationRemark("正常盘点");
        r5.setGaugerRemark("数据正常");
        r5.setSupervisorRemark("已调整");
        r5.setAdjustedVolume(new BigDecimal("-50"));
        r5.setCreateTime(LocalDateTime.now().minusDays(2));
        r5.setUpdateTime(LocalDateTime.now().minusDays(1));
        inventoryRecordRepository.save(r5);
        addHistoryRecord(r5, InventoryStatus.PENDING_REVIEW, "赵六", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(2));
        addHistoryRecord(r5, InventoryStatus.PENDING_DISPOSAL, "钱七", UserRole.GAUGER,
                "计量员复核通过", LocalDateTime.now().minusDays(2).plusHours(2));
        addHistoryRecord(r5, InventoryStatus.ADJUSTED, "王五", UserRole.REGIONAL_SUPERVISOR,
                "区域主管调整库存，调整量：-50L", LocalDateTime.now().minusDays(1));
    }

    private void addHistoryRecord(InventoryRecord record, InventoryStatus actionType,
                                  String operator, UserRole role, String remark,
                                  LocalDateTime time) {
        InventoryHistory history = new InventoryHistory();
        history.setInventoryRecord(record);
        history.setActionType(actionType);
        history.setOperator(operator);
        history.setOperatorRole(role);
        history.setRemark(remark);
        history.setActionTime(time);
        historyRepository.save(history);
    }
}
