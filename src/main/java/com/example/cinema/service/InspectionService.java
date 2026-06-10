
package com.example.cinema.service;

import com.example.cinema.entity.*;
import com.example.cinema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InspectionService {

    @Autowired
    private InspectionRecordRepository inspectionRecordRepository;

    @Autowired
    private ScreeningRepository screeningRepository;

    @Autowired
    private HallRepository hallRepository;

    @Transactional
    public InspectionRecord submitInspection(Long screeningId, String inspectorName, 
            EquipmentStatus projectorStatus, EquipmentStatus audioStatus,
            EquipmentStatus lightingStatus, EquipmentStatus airConditioningStatus,
            EquipmentStatus seatingStatus, String remarks) {
        
        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new RuntimeException("场次不存在"));
        
        InspectionRecord record = new InspectionRecord();
        record.setScreening(screening);
        record.setInspectorName(inspectorName);
        record.setInspectionTime(LocalDateTime.now());
        record.setProjectorStatus(projectorStatus);
        record.setAudioStatus(audioStatus);
        record.setLightingStatus(lightingStatus);
        record.setAirConditioningStatus(airConditioningStatus);
        record.setSeatingStatus(seatingStatus);
        record.setRemarks(remarks);
        
        InspectionRecord saved = inspectionRecordRepository.save(record);
        
        screening.setStatus(ScreeningStatus.INSPECTED);
        screeningRepository.save(screening);
        
        boolean allNormal = projectorStatus == EquipmentStatus.NORMAL &&
                audioStatus == EquipmentStatus.NORMAL &&
                lightingStatus == EquipmentStatus.NORMAL &&
                airConditioningStatus == EquipmentStatus.NORMAL &&
                seatingStatus == EquipmentStatus.NORMAL;
        
        Hall hall = screening.getHall();
        hall.setEquipmentStatus(allNormal ? EquipmentStatus.NORMAL : EquipmentStatus.ABNORMAL);
        hallRepository.save(hall);
        
        return saved;
    }

    public List<InspectionRecord> getInspectionRecordsByScreening(Long screeningId) {
        return inspectionRecordRepository.findByScreeningId(screeningId);
    }
}
