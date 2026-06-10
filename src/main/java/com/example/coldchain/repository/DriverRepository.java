package com.example.coldchain.repository;

import com.example.coldchain.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByPhone(String phone);

    Optional<Driver> findByLicenseNumber(String licenseNumber);
}