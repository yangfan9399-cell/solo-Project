package com.example.marketstall.service;

import com.example.marketstall.entity.License;
import com.example.marketstall.repository.LicenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LicenseService {

    private final LicenseRepository licenseRepository;

    public List<License> getAllLicenses() {
        return licenseRepository.findAll();
    }

    public License getLicenseById(Long id) {
        return licenseRepository.findById(id).orElse(null);
    }

    public List<License> getLicensesByStallId(Long stallId) {
        return licenseRepository.findByStallId(stallId);
    }

    public License saveLicense(License license) {
        updateLicenseStatus(license);
        return licenseRepository.save(license);
    }

    public void deleteLicense(Long id) {
        licenseRepository.deleteById(id);
    }

    public List<License> getExpiredLicenses() {
        return licenseRepository.findExpiredLicenses(LocalDate.now());
    }

    public boolean canRenewLease(Long stallId) {
        List<License> licenses = licenseRepository.findByStallId(stallId);
        for (License license : licenses) {
            updateLicenseStatus(license);
            if ("expired".equals(license.getStatus())) {
                return false;
            }
        }
        return true;
    }

    private void updateLicenseStatus(License license) {
        if (license.getExpiryDate() != null && license.getExpiryDate().isBefore(LocalDate.now())) {
            license.setStatus("expired");
        } else if ("expired".equals(license.getStatus()) && 
                   license.getExpiryDate() != null && 
                   license.getExpiryDate().isAfter(LocalDate.now())) {
            license.setStatus("valid");
        }
    }

    public Map<String, Long> countByLicenseType() {
        return licenseRepository.countByLicenseType().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }
}