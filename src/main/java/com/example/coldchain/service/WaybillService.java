package com.example.coldchain.service;

import com.example.coldchain.entity.Waybill;
import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.repository.WaybillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WaybillService {

    private final WaybillRepository waybillRepository;

    public List<Waybill> findAll() {
        return waybillRepository.findAll();
    }

    public Optional<Waybill> findById(Long id) {
        return waybillRepository.findById(id);
    }

    public Optional<Waybill> findByWaybillNo(String waybillNo) {
        return waybillRepository.findByWaybillNo(waybillNo);
    }

    public List<Waybill> findAbnormalWaybills() {
        return waybillRepository.findAbnormalWaybills();
    }

    @Transactional
    public Waybill save(Waybill waybill) {
        return waybillRepository.save(waybill);
    }

    @Transactional
    public Waybill updateStatus(Long id, WaybillStatus status) {
        Waybill waybill = waybillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("运单不存在"));
        waybill.setStatus(status);
        return waybillRepository.save(waybill);
    }
}