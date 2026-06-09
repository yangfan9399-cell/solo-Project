package com.gasstation.config;

import com.gasstation.entity.*;
import com.gasstation.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

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
    @Transactional
    public void run(String... args) {
        logger.info("开始初始化样本数据...");

        initStations();
        initOilProducts();
        initTanks();
        initUsers();
        initDeliveryOrders();
        initInventoryRecords();

        logger.info("样本数据初始化完成");
    }

    private void initStations() {
        createStationIfNotExists("ST001", "城东路加油站", "城东路128号", "021-88880001");
        createStationIfNotExists("ST002", "西环路加油站", "西环路56号", "021-88880002");
        createStationIfNotExists("ST003", "南港路加油站", "南港路200号", "021-88880003");
    }

    private void createStationIfNotExists(String code, String name, String address, String phone) {
        Station station = stationRepository.findByStationCode(code);
        if (station == null) {
            station = new Station();
            station.setStationCode(code);
            station.setStationName(name);
            station.setAddress(address);
            station.setPhone(phone);
            stationRepository.save(station);
            logger.info("创建站点: {}", name);
        }
    }

    private void initOilProducts() {
        createOilProductIfNotExists("92#", "92号汽油", new BigDecimal("0.725"), "国VI B标准");
        createOilProductIfNotExists("95#", "95号汽油", new BigDecimal("0.737"), "国VI B标准");
        createOilProductIfNotExists("0#", "0号柴油", new BigDecimal("0.835"), "国VI标准");
    }

    private void createOilProductIfNotExists(String code, String name, BigDecimal density, String description) {
        OilProduct product = oilProductRepository.findByProductCode(code);
        if (product == null) {
            product = new OilProduct();
            product.setProductCode(code);
            product.setProductName(name);
            product.setDensity(density);
            product.setDescription(description);
            oilProductRepository.save(product);
            logger.info("创建油品: {}", name);
        }
    }

    private void initTanks() {
        Station station1 = stationRepository.findByStationCode("ST001");
        Station station2 = stationRepository.findByStationCode("ST002");
        OilProduct p92 = oilProductRepository.findByProductCode("92#");
        OilProduct p95 = oilProductRepository.findByProductCode("95#");
        OilProduct p0 = oilProductRepository.findByProductCode("0#");

        createTankIfNotExists("T101", "1号罐", new BigDecimal("30000"), station1, p92, true, "92号汽油罐");
        createTankIfNotExists("T102", "2号罐", new BigDecimal("30000"), station1, p95, true, "95号汽油罐");
        createTankIfNotExists("T103", "3号罐", new BigDecimal("40000"), station1, p0, false, "0号柴油罐，液位仪故障待修");
        createTankIfNotExists("T201", "1号罐", new BigDecimal("25000"), station2, p92, true, "92号汽油罐");
        createTankIfNotExists("T202", "2号罐", new BigDecimal("25000"), station2, p95, true, "95号汽油罐");
    }

    private void createTankIfNotExists(String code, String name, BigDecimal capacity,
                                       Station station, OilProduct product, Boolean gaugeStatus, String remark) {
        Tank tank = tankRepository.findByTankCode(code);
        if (tank == null) {
            tank = new Tank();
            tank.setTankCode(code);
            tank.setTankName(name);
            tank.setCapacity(capacity);
            tank.setStation(station);
            tank.setOilProduct(product);
            tank.setGaugeStatus(gaugeStatus);
            tank.setRemark(remark);
            tankRepository.save(tank);
            logger.info("创建油罐: {}", code);
        }
    }

    private void initUsers() {
        Station station1 = stationRepository.findByStationCode("ST001");

        createUserIfNotExists("zhangsan", "张三", UserRole.STATION_MANAGER, station1, "13800000001");
        createUserIfNotExists("lisi", "李四", UserRole.GAUGER, station1, "13800000002");
        createUserIfNotExists("wangwu", "王五", UserRole.REGIONAL_SUPERVISOR, null, "13800000003");
    }

    private void createUserIfNotExists(String username, String realName, UserRole role, Station station, String phone) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setRealName(realName);
            user.setRole(role);
            user.setStation(station);
            user.setPhone(phone);
            userRepository.save(user);
            logger.info("创建用户: {}", realName);
        }
    }

    private void initDeliveryOrders() {
        Tank t101 = tankRepository.findByTankCode("T101");
        Tank t102 = tankRepository.findByTankCode("T102");
        Tank t103 = tankRepository.findByTankCode("T103");
        OilProduct p92 = oilProductRepository.findByProductCode("92#");
        OilProduct p95 = oilProductRepository.findByProductCode("95#");
        OilProduct p0 = oilProductRepository.findByProductCode("0#");

        createDeliveryOrderIfNotExists("D-SAMPLE-001", t101, p92,
                new BigDecimal("15000"), new BigDecimal("14980"),
                LocalDate.now().minusDays(2), "中石化运输公司", null);

        createDeliveryOrderIfNotExists("D-SAMPLE-002", t102, p95,
                new BigDecimal("12000"), new BigDecimal("11980"),
                LocalDate.now().minusDays(1), "中石化运输公司", null);

        createDeliveryOrderIfNotExists("D-SAMPLE-003", t103, p0,
                new BigDecimal("20000"), new BigDecimal("19500"),
                LocalDate.now().minusDays(3), "中石化运输公司", "配送量差异较大，待确认");
    }

    private void createDeliveryOrderIfNotExists(String deliveryNo, Tank tank, OilProduct product,
                                                 BigDecimal deliveryVolume, BigDecimal actualVolume,
                                                 LocalDate deliveryDate, String carrier, String remark) {
        DeliveryOrder order = deliveryOrderRepository.findByDeliveryNo(deliveryNo);
        if (order == null) {
            order = new DeliveryOrder();
            order.setDeliveryNo(deliveryNo);
            order.setTank(tank);
            order.setOilProduct(product);
            order.setDeliveryVolume(deliveryVolume);
            order.setActualVolume(actualVolume);
            order.setDeliveryDate(deliveryDate);
            order.setCarrier(carrier);
            order.setRemark(remark);
            deliveryOrderRepository.save(order);
            logger.info("创建配送单: {}", deliveryNo);
        }
    }

    private void initInventoryRecords() {
        logger.info("开始初始化盘点样本数据，覆盖四种差异类型...");

        createNormalInventoryRecord();
        createExcessLossInventoryRecord();
        createGaugeErrorInventoryRecord();
        createDeliveryMismatchInventoryRecord();
        createNormalAdjustedInventoryRecord();
    }

    private void createNormalInventoryRecord() {
        String recordNo = "PD-SAMPLE-NORMAL-01";
        if (inventoryRecordRepository.findByRecordNo(recordNo) != null) {
            return;
        }

        Tank tank = tankRepository.findByTankCode("T101");
        Station station = stationRepository.findByStationCode("ST001");
        OilProduct product = oilProductRepository.findByProductCode("92#");

        InventoryRecord record = new InventoryRecord();
        record.setRecordNo(recordNo);
        record.setTank(tank);
        record.setStation(station);
        record.setOilProduct(product);
        record.setInventoryDate(LocalDate.now().minusDays(3));
        record.setOpeningVolume(new BigDecimal("18500"));
        record.setDeliveryVolume(new BigDecimal("15000"));
        record.setSalesVolume(new BigDecimal("8200"));
        record.setGaugeVolume(new BigDecimal("25260"));
        record.setTheoreticalVolume(new BigDecimal("25300"));
        record.setDifferenceVolume(new BigDecimal("-40"));
        record.setLossRate(new BigDecimal("0.0016"));
        record.setWaterLevel(new BigDecimal("5"));
        record.setTemperature(new BigDecimal("22.5"));
        record.setGaugeNormal(true);
        record.setDiscrepancyType(DiscrepancyType.NORMAL);
        record.setStatus(InventoryStatus.ARCHIVED);
        record.setStationManager("张三");
        record.setGauger("李四");
        record.setSupervisor("王五");
        record.setStationRemark("日盘点正常");
        record.setGaugerRemark("数据复核无误");
        record.setSupervisorRemark("正常归档");
        record.setCreateTime(LocalDateTime.now().minusDays(3));
        record.setUpdateTime(LocalDateTime.now().minusDays(2));
        inventoryRecordRepository.save(record);

        addHistoryRecord(record, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(3));
        addHistoryRecord(record, InventoryStatus.PENDING_DISPOSAL, "李四", UserRole.GAUGER,
                "计量员复核通过，提交待处置", LocalDateTime.now().minusDays(3).plusHours(2));
        addHistoryRecord(record, InventoryStatus.ARCHIVED, "王五", UserRole.REGIONAL_SUPERVISOR,
                "区域主管归档（正常盘点），说明：数据正常，完成盘点", LocalDateTime.now().minusDays(2));

        logger.info("创建盘点正常样本: {}", recordNo);
    }

    private void createExcessLossInventoryRecord() {
        String recordNo = "PD-SAMPLE-LOSS-01";
        if (inventoryRecordRepository.findByRecordNo(recordNo) != null) {
            return;
        }

        Tank tank = tankRepository.findByTankCode("T102");
        Station station = stationRepository.findByStationCode("ST001");
        OilProduct product = oilProductRepository.findByProductCode("95#");

        InventoryRecord record = new InventoryRecord();
        record.setRecordNo(recordNo);
        record.setTank(tank);
        record.setStation(station);
        record.setOilProduct(product);
        record.setInventoryDate(LocalDate.now().minusDays(2));
        record.setOpeningVolume(new BigDecimal("16200"));
        record.setDeliveryVolume(new BigDecimal("12000"));
        record.setSalesVolume(new BigDecimal("6500"));
        record.setGaugeVolume(new BigDecimal("21580"));
        record.setTheoreticalVolume(new BigDecimal("21700"));
        record.setDifferenceVolume(new BigDecimal("-120"));
        record.setLossRate(new BigDecimal("0.0055"));
        record.setWaterLevel(new BigDecimal("8"));
        record.setTemperature(new BigDecimal("21.8"));
        record.setGaugeNormal(true);
        record.setDiscrepancyType(DiscrepancyType.EXCESS_LOSS);
        record.setStatus(InventoryStatus.PENDING_DISPOSAL);
        record.setStationManager("张三");
        record.setGauger("李四");
        record.setStationRemark("损耗偏大，可能有渗漏");
        record.setGaugerRemark("损耗率0.55%，超阈值0.3%，请主管处置");
        record.setCreateTime(LocalDateTime.now().minusDays(2));
        record.setUpdateTime(LocalDateTime.now().minusDays(1));
        inventoryRecordRepository.save(record);

        addHistoryRecord(record, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(2));
        addHistoryRecord(record, InventoryStatus.PENDING_DISPOSAL, "李四", UserRole.GAUGER,
                "计量员复核通过（损耗超标），提交待处置，损耗率0.55%，超阈值0.3%", LocalDateTime.now().minusDays(1));

        logger.info("创建损耗超标样本: {}", recordNo);
    }

    private void createGaugeErrorInventoryRecord() {
        String recordNo = "PD-SAMPLE-GAUGE-01";
        if (inventoryRecordRepository.findByRecordNo(recordNo) != null) {
            return;
        }

        Tank tank = tankRepository.findByTankCode("T103");
        Station station = stationRepository.findByStationCode("ST001");
        OilProduct product = oilProductRepository.findByProductCode("0#");

        InventoryRecord record = new InventoryRecord();
        record.setRecordNo(recordNo);
        record.setTank(tank);
        record.setStation(station);
        record.setOilProduct(product);
        record.setInventoryDate(LocalDate.now().minusDays(1));
        record.setOpeningVolume(new BigDecimal("22000"));
        record.setDeliveryVolume(new BigDecimal("20000"));
        record.setSalesVolume(new BigDecimal("5500"));
        record.setGaugeVolume(new BigDecimal("36000"));
        record.setTheoreticalVolume(new BigDecimal("36500"));
        record.setDifferenceVolume(new BigDecimal("-500"));
        record.setLossRate(new BigDecimal("0.0137"));
        record.setWaterLevel(new BigDecimal("20"));
        record.setTemperature(new BigDecimal("20.0"));
        record.setGaugeNormal(false);
        record.setDiscrepancyType(DiscrepancyType.GAUGE_ERROR);
        record.setStatus(InventoryStatus.INVESTIGATING);
        record.setStationManager("张三");
        record.setGauger("李四");
        record.setSupervisor("王五");
        record.setStationRemark("液位仪显示异常，读数波动大");
        record.setGaugerRemark("液位仪故障，数据仅供参考，建议检修");
        record.setSupervisorRemark("已安排维修，追查中");
        record.setCreateTime(LocalDateTime.now().minusDays(1));
        record.setUpdateTime(LocalDateTime.now().minusHours(12));
        inventoryRecordRepository.save(record);

        addHistoryRecord(record, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点（液位仪异常），提交待复核", LocalDateTime.now().minusDays(1));
        addHistoryRecord(record, InventoryStatus.PENDING_DISPOSAL, "李四", UserRole.GAUGER,
                "计量员复核，液位仪故障，数据仅供参考，建议检修", LocalDateTime.now().minusDays(1).plusHours(3));
        addHistoryRecord(record, InventoryStatus.INVESTIGATING, "王五", UserRole.REGIONAL_SUPERVISOR,
                "区域主管启动追查（液位仪异常，需安排检修），说明：已联系设备厂家安排维修", LocalDateTime.now().minusHours(12));

        logger.info("创建液位仪异常样本: {}", recordNo);
    }

    private void createDeliveryMismatchInventoryRecord() {
        String recordNo = "PD-SAMPLE-DELIVERY-01";
        if (inventoryRecordRepository.findByRecordNo(recordNo) != null) {
            return;
        }

        Tank tank = tankRepository.findByTankCode("T101");
        Station station = stationRepository.findByStationCode("ST001");
        OilProduct product = oilProductRepository.findByProductCode("92#");

        InventoryRecord record = new InventoryRecord();
        record.setRecordNo(recordNo);
        record.setTank(tank);
        record.setStation(station);
        record.setOilProduct(product);
        record.setInventoryDate(LocalDate.now());
        record.setOpeningVolume(new BigDecimal("25260"));
        record.setDeliveryVolume(new BigDecimal("10000"));
        record.setSalesVolume(new BigDecimal("6800"));
        record.setGaugeVolume(new BigDecimal("28100"));
        record.setTheoreticalVolume(new BigDecimal("28460"));
        record.setDifferenceVolume(new BigDecimal("-360"));
        record.setLossRate(new BigDecimal("0.0126"));
        record.setWaterLevel(new BigDecimal("6"));
        record.setTemperature(new BigDecimal("23.2"));
        record.setGaugeNormal(true);
        record.setDiscrepancyType(DiscrepancyType.DELIVERY_MISMATCH);
        record.setStatus(InventoryStatus.PENDING_REVIEW);
        record.setStationManager("张三");
        record.setStationRemark("今日配送量核对差异较大，怀疑配送量不足");
        record.setCreateTime(LocalDateTime.now().minusHours(2));
        record.setUpdateTime(LocalDateTime.now().minusHours(2));
        inventoryRecordRepository.save(record);

        addHistoryRecord(record, InventoryStatus.PENDING_REVIEW, "张三", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusHours(2));

        logger.info("创建配送量不符样本: {}", recordNo);
    }

    private void createNormalAdjustedInventoryRecord() {
        String recordNo = "PD-SAMPLE-ADJUSTED-01";
        if (inventoryRecordRepository.findByRecordNo(recordNo) != null) {
            return;
        }

        Tank tank = tankRepository.findByTankCode("T201");
        Station station = stationRepository.findByStationCode("ST002");
        OilProduct product = oilProductRepository.findByProductCode("92#");

        InventoryRecord record = new InventoryRecord();
        record.setRecordNo(recordNo);
        record.setTank(tank);
        record.setStation(station);
        record.setOilProduct(product);
        record.setInventoryDate(LocalDate.now().minusDays(2));
        record.setOpeningVolume(new BigDecimal("15800"));
        record.setDeliveryVolume(new BigDecimal("10000"));
        record.setSalesVolume(new BigDecimal("6200"));
        record.setGaugeVolume(new BigDecimal("19550"));
        record.setTheoreticalVolume(new BigDecimal("19600"));
        record.setDifferenceVolume(new BigDecimal("-50"));
        record.setLossRate(new BigDecimal("0.0026"));
        record.setWaterLevel(new BigDecimal("4"));
        record.setTemperature(new BigDecimal("22.0"));
        record.setGaugeNormal(true);
        record.setDiscrepancyType(DiscrepancyType.NORMAL);
        record.setStatus(InventoryStatus.ADJUSTED);
        record.setStationManager("赵六");
        record.setGauger("钱七");
        record.setSupervisor("王五");
        record.setStationRemark("正常盘点");
        record.setGaugerRemark("数据正常");
        record.setSupervisorRemark("已调整");
        record.setAdjustedVolume(new BigDecimal("-50"));
        record.setCreateTime(LocalDateTime.now().minusDays(2));
        record.setUpdateTime(LocalDateTime.now().minusDays(1));
        inventoryRecordRepository.save(record);

        addHistoryRecord(record, InventoryStatus.PENDING_REVIEW, "赵六", UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核", LocalDateTime.now().minusDays(2));
        addHistoryRecord(record, InventoryStatus.PENDING_DISPOSAL, "钱七", UserRole.GAUGER,
                "计量员复核通过", LocalDateTime.now().minusDays(2).plusHours(2));
        addHistoryRecord(record, InventoryStatus.ADJUSTED, "王五", UserRole.REGIONAL_SUPERVISOR,
                "区域主管调整库存（正常盘点微调），调整量：-50L，说明：正常损耗微调", LocalDateTime.now().minusDays(1));

        logger.info("创建已调整正常样本: {}", recordNo);
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
