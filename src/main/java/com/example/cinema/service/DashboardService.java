
package com.example.cinema.service;

import com.example.cinema.entity.*;
import com.example.cinema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private CinemaRepository cinemaRepository;

    @Autowired
    private HallRepository hallRepository;

    @Autowired
    private ScreeningRepository screeningRepository;

    @Autowired
    private InterruptRecordRepository interruptRecordRepository;

    @Autowired
    private CompensationRecordRepository compensationRecordRepository;

    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();
        
        long totalInterrupts = interruptRecordRepository.count();
        long unresolvedInterrupts = interruptRecordRepository.findByIsResolvedFalse().size();
        long pendingCompensations = compensationRecordRepository.findByStatus(CompensationStatus.PENDING).size();
        
        BigDecimal totalCompensationAmount = compensationRecordRepository.findAll().stream()
                .map(CompensationRecord::getCompensationAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        data.put("totalInterrupts", totalInterrupts);
        data.put("unresolvedInterrupts", unresolvedInterrupts);
        data.put("pendingCompensations", pendingCompensations);
        data.put("totalCompensationAmount", totalCompensationAmount);
        
        return data;
    }

    public List<Map<String, Object>> getInterruptsByCinema() {
        List<Cinema> cinemas = cinemaRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Cinema cinema : cinemas) {
            List<InterruptRecord> interrupts = interruptRecordRepository.findByScreeningHallCinemaId(cinema.getId());
            
            Map<String, Object> cinemaData = new HashMap<>();
            cinemaData.put("cinemaId", cinema.getId());
            cinemaData.put("cinemaName", cinema.getName());
            cinemaData.put("interruptCount", interrupts.size());
            
            BigDecimal compensationAmount = compensationRecordRepository.sumCompensationByCinema(cinema.getId());
            cinemaData.put("compensationAmount", compensationAmount != null ? compensationAmount : BigDecimal.ZERO);
            
            result.add(cinemaData);
        }
        
        return result;
    }

    public List<Map<String, Object>> getInterruptsByHall(Long cinemaId) {
        List<Hall> halls = hallRepository.findByCinemaId(cinemaId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Hall hall : halls) {
            List<InterruptRecord> interrupts = interruptRecordRepository.findAll().stream()
                    .filter(i -> i.getScreening().getHall().getId().equals(hall.getId()))
                    .collect(Collectors.toList());
            
            Map<String, Object> hallData = new HashMap<>();
            hallData.put("hallId", hall.getId());
            hallData.put("hallName", hall.getName());
            hallData.put("equipmentStatus", hall.getEquipmentStatus());
            hallData.put("interruptCount", interrupts.size());
            
            result.add(hallData);
        }
        
        return result;
    }

    public List<Map<String, Object>> getInterruptsByFaultType() {
        List<InterruptRecord> allInterrupts = interruptRecordRepository.findAll();
        
        Map<FaultType, List<InterruptRecord>> grouped = allInterrupts.stream()
                .collect(Collectors.groupingBy(InterruptRecord::getFaultType));
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Map.Entry<FaultType, List<InterruptRecord>> entry : grouped.entrySet()) {
            Map<String, Object> faultData = new HashMap<>();
            faultData.put("faultType", entry.getKey());
            faultData.put("faultTypeName", entry.getKey().getDescription());
            faultData.put("count", entry.getValue().size());
            
            BigDecimal compensationAmount = compensationRecordRepository.sumCompensationByFaultType(entry.getKey().name());
            faultData.put("compensationAmount", compensationAmount != null ? compensationAmount : BigDecimal.ZERO);
            
            result.add(faultData);
        }
        
        return result;
    }

    public List<Screening> getScreeningsForToday(Long cinemaId) {
        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        
        return screeningRepository.findByHallCinemaId(cinemaId).stream()
                .filter(s -> s.getStartTime().isAfter(todayStart) && s.getStartTime().isBefore(todayEnd))
                .sorted(Comparator.comparing(Screening::getStartTime))
                .collect(Collectors.toList());
    }
}
