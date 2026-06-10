package com.example.coldchain.service;

import com.example.coldchain.entity.TemperatureRecord;
import com.example.coldchain.repository.TemperatureRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemperatureService {

    private final TemperatureRecordRepository temperatureRecordRepository;

    public List<TemperatureRecord> findByWaybillId(Long waybillId) {
        return temperatureRecordRepository.findByWaybillIdOrderByRecordTimeAsc(waybillId);
    }

    public List<TemperatureRecord> findExceptionsByWaybillId(Long waybillId) {
        return temperatureRecordRepository.findByWaybillIdAndIsExceptionTrue(waybillId);
    }

    public TemperatureRecord findLatestByWaybillId(Long waybillId) {
        return temperatureRecordRepository.findLatestByWaybillId(waybillId);
    }

    @Transactional
    public TemperatureRecord save(TemperatureRecord record) {
        return temperatureRecordRepository.save(record);
    }

    @Transactional
    public TemperatureRecord createRecord(Long waybillId, BigDecimal temperature, BigDecimal humidity,
                                          String sensorId, String location) {
        TemperatureRecord record = new TemperatureRecord();
        record.setWaybillId(waybillId);
        record.setTemperature(temperature);
        record.setHumidity(humidity);
        record.setRecordTime(LocalDateTime.now());
        record.setSensorId(sensorId);
        record.setLocation(location);
        record.setIsException(false);
        return temperatureRecordRepository.save(record);
    }
}