package com.example.marketstall.service;

import com.example.marketstall.dto.StallDetailDTO;
import com.example.marketstall.entity.Stall;
import com.example.marketstall.repository.StallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StallService {

    private final StallRepository stallRepository;
    private final TenantService tenantService;
    private final PaymentRecordService paymentRecordService;
    private final LicenseService licenseService;
    private final ViolationRecordService violationRecordService;
    private final HistoryNodeService historyNodeService;

    public List<Stall> getAllStalls() {
        return stallRepository.findAll();
    }

    public Stall getStallById(Long id) {
        return stallRepository.findById(id).orElse(null);
    }

    public Stall getStallByCode(String code) {
        return stallRepository.findByStallCode(code);
    }

    public Stall saveStall(Stall stall) {
        return stallRepository.save(stall);
    }

    public void deleteStall(Long id) {
        stallRepository.deleteById(id);
    }

    public List<Stall> getStallsByArea(String area) {
        return stallRepository.findByArea(area);
    }

    public List<Stall> getStallsByCategory(String category) {
        return stallRepository.findByCategory(category);
    }

    public StallDetailDTO getStallDetail(Long stallId) {
        Stall stall = stallRepository.findById(stallId).orElse(null);
        if (stall == null) return null;

        StallDetailDTO detail = new StallDetailDTO();
        detail.setStall(stall);
        detail.setTenant(tenantService.getTenantById(stall.getTenantId()));
        detail.setPaymentRecords(paymentRecordService.getPaymentRecordsByStallId(stallId));
        detail.setLicenses(licenseService.getLicensesByStallId(stallId));
        detail.setViolationRecords(violationRecordService.getViolationRecordsByStallId(stallId));
        detail.setHistoryNodes(historyNodeService.getHistoryNodesByStallId(stallId));
        detail.setCanRenew(licenseService.canRenewLease(stallId));
        
        return detail;
    }

    public Map<String, Long> countByArea() {
        return stallRepository.countByArea().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    public Map<String, Long> countByCategory() {
        return stallRepository.countByCategory().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    public Map<String, Long> countByStatus() {
        return stallRepository.countByStatus().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }
}