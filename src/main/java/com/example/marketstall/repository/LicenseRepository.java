package com.example.marketstall.repository;

import com.example.marketstall.entity.License;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LicenseRepository extends JpaRepository<License, Long> {
    List<License> findByStallId(Long stallId);
    List<License> findByLicenseType(String licenseType);
    List<License> findByStatus(String status);
    License findByLicenseNumber(String licenseNumber);
    
    @Query("SELECT l FROM License l WHERE l.expiryDate < :date")
    List<License> findExpiredLicenses(LocalDate date);
    
    @Query("SELECT l.licenseType, COUNT(l) FROM License l GROUP BY l.licenseType")
    List<Object[]> countByLicenseType();
}