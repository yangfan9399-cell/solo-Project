package com.example.coldchain.config;

import com.example.coldchain.entity.*;
import com.example.coldchain.enums.*;
import com.example.coldchain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final WaybillRepository waybillRepository;
    private final TemperatureRecordRepository temperatureRecordRepository;
    private final ExceptionRecordRepository exceptionRecordRepository;
    private final DisposalRecordRepository disposalRecordRepository;
    private final CompensationRepository compensationRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @Override
    public void run(String... args) {
        if (driverRepository.count() == 0) {
            initDrivers();
        }
        if (vehicleRepository.count() == 0) {
            initVehicles();
        }
        if (waybillRepository.count() == 0) {
            initWaybills();
        }
    }

    private void initDrivers() {
        Driver driver1 = new Driver();
        driver1.setName("张三");
        driver1.setPhone("13800138001");
        driver1.setLicenseNumber("A1234567");
        driver1.setStatus("active");
        driverRepository.save(driver1);

        Driver driver2 = new Driver();
        driver2.setName("李四");
        driver2.setPhone("13800138002");
        driver2.setLicenseNumber("B1234567");
        driver2.setStatus("active");
        driverRepository.save(driver2);
    }

    private void initVehicles() {
        Vehicle vehicle1 = new Vehicle();
        vehicle1.setPlateNumber("京A12345");
        vehicle1.setVehicleType("冷藏车");
        vehicle1.setCapacity(10);
        vehicle1.setRefrigerationType("风冷");
        vehicle1.setStatus("running");
        vehicle1.setDriverId(1L);
        vehicleRepository.save(vehicle1);

        Vehicle vehicle2 = new Vehicle();
        vehicle2.setPlateNumber("京B67890");
        vehicle2.setVehicleType("冷藏车");
        vehicle2.setCapacity(8);
        vehicle2.setRefrigerationType("水冷");
        vehicle2.setStatus("running");
        vehicle2.setDriverId(2L);
        vehicleRepository.save(vehicle2);
    }

    private void initWaybills() {
        initNormalWaybill();
        initTemperatureExceptionWaybill();
        initSensorOfflineWaybill();
        initCompensationDisputeWaybill();
    }

    private void initNormalWaybill() {
        Waybill waybill = new Waybill();
        waybill.setWaybillNo("WB2024001");
        waybill.setOrigin("北京");
        waybill.setDestination("上海");
        waybill.setProductType(ProductType.PHARMACEUTICAL);
        waybill.setProductName("疫苗");
        waybill.setQuantity(100);
        waybill.setUnit("盒");
        waybill.setTemperatureMin(new BigDecimal("2"));
        waybill.setTemperatureMax(new BigDecimal("8"));
        waybill.setVehicleId(1L);
        waybill.setDriverId(1L);
        waybill.setStatus(WaybillStatus.SIGNED);
        waybill.setDepartureTime(LocalDateTime.now().minusDays(2));
        waybill.setArrivalTime(LocalDateTime.now().minusDays(1));
        waybill.setSignedTime(LocalDateTime.now().minusDays(1));
        waybillRepository.save(waybill);

        for (int i = 0; i < 24; i++) {
            TemperatureRecord record = new TemperatureRecord();
            record.setWaybillId(waybill.getId());
            record.setTemperature(new BigDecimal("5"));
            record.setHumidity(new BigDecimal("60"));
            record.setRecordTime(waybill.getDepartureTime().plusHours(i));
            record.setSensorId("S001");
            record.setLocation("运输中");
            record.setIsException(false);
            temperatureRecordRepository.save(record);
        }
    }

    private void initTemperatureExceptionWaybill() {
        Waybill waybill = new Waybill();
        waybill.setWaybillNo("WB2024002");
        waybill.setOrigin("广州");
        waybill.setDestination("成都");
        waybill.setProductType(ProductType.FROZEN_FOOD);
        waybill.setProductName("冷冻海鲜");
        waybill.setQuantity(500);
        waybill.setUnit("kg");
        waybill.setTemperatureMin(new BigDecimal("-18"));
        waybill.setTemperatureMax(new BigDecimal("-10"));
        waybill.setVehicleId(2L);
        waybill.setDriverId(2L);
        waybill.setStatus(WaybillStatus.EXCEPTION);
        waybill.setDepartureTime(LocalDateTime.now().minusDays(1));
        waybill.setArrivalTime(null);
        waybillRepository.save(waybill);

        for (int i = 0; i < 18; i++) {
            TemperatureRecord record = new TemperatureRecord();
            record.setWaybillId(waybill.getId());
            BigDecimal temp = new BigDecimal("-15");
            if (i >= 10 && i <= 14) {
                temp = new BigDecimal("-5");
            }
            record.setTemperature(temp);
            record.setHumidity(new BigDecimal("70"));
            record.setRecordTime(waybill.getDepartureTime().plusHours(i));
            record.setSensorId("S002");
            record.setLocation(i < 10 ? "广州境内" : "湖南境内");
            record.setIsException(i >= 10 && i <= 14);
            temperatureRecordRepository.save(record);
        }

        ExceptionRecord exception = new ExceptionRecord();
        exception.setWaybillId(waybill.getId());
        exception.setExceptionType(ExceptionType.TEMPERATURE_OVER_LIMIT);
        exception.setDescription("温度超限，当前温度-5°C，超出允许范围-18°C~-10°C");
        exception.setExceptionTime(waybill.getDepartureTime().plusHours(10));
        exception.setLocation("湖南长沙");
        exception.setIsDisposed(false);
        exceptionRecordRepository.save(exception);
    }

    private void initSensorOfflineWaybill() {
        Waybill waybill = new Waybill();
        waybill.setWaybillNo("WB2024003");
        waybill.setOrigin("深圳");
        waybill.setDestination("武汉");
        waybill.setProductType(ProductType.FRESH_PRODUCE);
        waybill.setProductName("草莓");
        waybill.setQuantity(200);
        waybill.setUnit("箱");
        waybill.setTemperatureMin(new BigDecimal("0"));
        waybill.setTemperatureMax(new BigDecimal("4"));
        waybill.setVehicleId(1L);
        waybill.setDriverId(2L);
        waybill.setStatus(WaybillStatus.EXCEPTION);
        waybill.setDepartureTime(LocalDateTime.now().minusHours(8));
        waybill.setArrivalTime(null);
        waybillRepository.save(waybill);

        for (int i = 0; i < 4; i++) {
            TemperatureRecord record = new TemperatureRecord();
            record.setWaybillId(waybill.getId());
            record.setTemperature(new BigDecimal("2"));
            record.setHumidity(new BigDecimal("85"));
            record.setRecordTime(waybill.getDepartureTime().plusHours(i));
            record.setSensorId("S003");
            record.setLocation("广东境内");
            record.setIsException(false);
            temperatureRecordRepository.save(record);
        }

        ExceptionRecord exception = new ExceptionRecord();
        exception.setWaybillId(waybill.getId());
        exception.setExceptionType(ExceptionType.SENSOR_OFFLINE);
        exception.setDescription("传感器离线超过2小时，无法获取温度数据");
        exception.setExceptionTime(waybill.getDepartureTime().plusHours(4));
        exception.setLocation("广东韶关");
        exception.setIsDisposed(false);
        exceptionRecordRepository.save(exception);
    }

    private void initCompensationDisputeWaybill() {
        Waybill waybill = new Waybill();
        waybill.setWaybillNo("WB2024004");
        waybill.setOrigin("杭州");
        waybill.setDestination("西安");
        waybill.setProductType(ProductType.DAIRY);
        waybill.setProductName("鲜奶");
        waybill.setQuantity(1000);
        waybill.setUnit("L");
        waybill.setTemperatureMin(new BigDecimal("2"));
        waybill.setTemperatureMax(new BigDecimal("6"));
        waybill.setVehicleId(2L);
        waybill.setDriverId(1L);
        waybill.setStatus(WaybillStatus.COMPENSATION_PENDING);
        waybill.setDepartureTime(LocalDateTime.now().minusDays(3));
        waybill.setArrivalTime(LocalDateTime.now().minusDays(2));
        waybillRepository.save(waybill);

        for (int i = 0; i < 30; i++) {
            TemperatureRecord record = new TemperatureRecord();
            record.setWaybillId(waybill.getId());
            BigDecimal temp = new BigDecimal("4");
            if (i >= 12 && i <= 20) {
                temp = new BigDecimal("10");
            }
            record.setTemperature(temp);
            record.setHumidity(new BigDecimal("75"));
            record.setRecordTime(waybill.getDepartureTime().plusHours(i));
            record.setSensorId("S004");
            record.setLocation(i < 12 ? "浙江境内" : (i < 20 ? "江西境内" : "湖北境内"));
            record.setIsException(i >= 12 && i <= 20);
            temperatureRecordRepository.save(record);
        }

        ExceptionRecord exception = new ExceptionRecord();
        exception.setWaybillId(waybill.getId());
        exception.setExceptionType(ExceptionType.TEMPERATURE_OVER_LIMIT);
        exception.setDescription("温度持续超标8小时，鲜奶可能变质");
        exception.setExceptionTime(waybill.getDepartureTime().plusHours(12));
        exception.setLocation("江西南昌");
        exception.setIsDisposed(true);
        exceptionRecordRepository.save(exception);

        DisposalRecord disposal = new DisposalRecord();
        disposal.setExceptionId(exception.getId());
        disposal.setWaybillId(waybill.getId());
        disposal.setHandlerId(1L);
        disposal.setHandlerName("司机张三");
        disposal.setDisposalMethod("发现温度异常后立即降低制冷功率，加强保温措施");
        disposal.setDisposalResult("温度已恢复正常范围，但部分货品可能已受影响");
        disposal.setStatus(DisposalStatus.COMPLETED);
        disposal.setDisposalTime(waybill.getDepartureTime().plusHours(21));
        disposalRecordRepository.save(disposal);

        Compensation compensation = new Compensation();
        compensation.setWaybillId(waybill.getId());
        compensation.setStatus(CompensationStatus.ASSESSED);
        compensation.setDamageDescription("鲜奶因温度超标8小时导致品质下降");
        compensation.setDamagePercentage(new BigDecimal("30"));
        compensation.setClaimedAmount(new BigDecimal("50000"));
        compensation.setAssessedAmount(new BigDecimal("15000"));
        compensation.setAssessorId(2L);
        compensation.setAssessorName("质控李四");
        compensation.setAssessmentTime(LocalDateTime.now().minusDays(1));
        compensation.setAssessorComment("根据温度记录和货品特性评估损失");
        compensationRepository.save(compensation);
    }
}