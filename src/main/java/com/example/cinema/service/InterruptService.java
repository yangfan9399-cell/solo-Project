
package com.example.cinema.service;

import com.example.cinema.entity.*;
import com.example.cinema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InterruptService {

    @Autowired
    private InterruptRecordRepository interruptRecordRepository;

    @Autowired
    private ScreeningRepository screeningRepository;

    @Autowired
    private HallRepository hallRepository;

    @Transactional
    public InterruptRecord reportInterrupt(Long screeningId, String reporterName, 
            FaultType faultType, String faultDescription) {
        
        Screening screening = screeningRepository.findById(screeningId)
                .orElseThrow(() -> new RuntimeException("场次不存在"));
        
        InterruptRecord record = new InterruptRecord();
        record.setScreening(screening);
        record.setReporterName(reporterName);
        record.setInterruptTime(LocalDateTime.now());
        record.setFaultType(faultType);
        record.setFaultDescription(faultDescription);
        record.setIsResolved(false);
        
        InterruptRecord saved = interruptRecordRepository.save(record);
        
        screening.setStatus(ScreeningStatus.INTERRUPTED);
        screeningRepository.save(screening);
        
        Hall hall = screening.getHall();
        hall.setEquipmentStatus(EquipmentStatus.FAULT);
        hallRepository.save(hall);
        
        stopSellingForHall(hall.getId());
        
        return saved;
    }

    @Transactional
    public InterruptRecord resolveInterrupt(Long interruptId, String resolutionNote) {
        InterruptRecord record = interruptRecordRepository.findById(interruptId)
                .orElseThrow(() -> new RuntimeException("中断记录不存在"));
        
        record.setIsResolved(true);
        record.setResumeTime(LocalDateTime.now());
        record.setResolutionNote(resolutionNote);
        
        InterruptRecord saved = interruptRecordRepository.save(record);
        
        Screening screening = record.getScreening();
        screening.setStatus(ScreeningStatus.RESUMED);
        screeningRepository.save(screening);
        
        Hall hall = screening.getHall();
        hall.setEquipmentStatus(EquipmentStatus.NORMAL);
        hallRepository.save(hall);
        
        resumeSellingForHall(hall.getId());
        
        return saved;
    }

    private void stopSellingForHall(Long hallId) {
        List<Screening> upcomingScreenings = screeningRepository
                .findUpcomingScreeningsByHall(hallId, LocalDateTime.now());
        
        for (Screening screening : upcomingScreenings) {
            screening.setIsSelling(false);
            screeningRepository.save(screening);
        }
    }

    private void resumeSellingForHall(Long hallId) {
        List<Screening> upcomingScreenings = screeningRepository
                .findUpcomingScreeningsByHall(hallId, LocalDateTime.now());
        
        for (Screening screening : upcomingScreenings) {
            screening.setIsSelling(true);
            screeningRepository.save(screening);
        }
    }

    public List<InterruptRecord> getAllInterruptRecords() {
        return interruptRecordRepository.findAllWithScreening();
    }

    public List<InterruptRecord> getUnresolvedInterrupts() {
        return interruptRecordRepository.findWithScreeningByResolvedStatus(false);
    }

    public List<InterruptRecord> getInterruptRecordsByScreening(Long screeningId) {
        return interruptRecordRepository.findByScreeningId(screeningId);
    }
}
