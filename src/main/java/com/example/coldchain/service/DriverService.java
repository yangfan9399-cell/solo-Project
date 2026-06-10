package com.example.coldchain.service;

import com.example.coldchain.entity.Driver;
import com.example.coldchain.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;

    public Optional<Driver> findById(Long id) {
        return driverRepository.findById(id);
    }

    public Optional<Driver> findByPhone(String phone) {
        return driverRepository.findByPhone(phone);
    }
}