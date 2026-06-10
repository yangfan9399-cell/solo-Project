package com.example.coldchain.service;

import com.example.coldchain.entity.Vehicle;
import com.example.coldchain.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public Optional<Vehicle> findById(Long id) {
        return vehicleRepository.findById(id);
    }

    public Optional<Vehicle> findByPlateNumber(String plateNumber) {
        return vehicleRepository.findByPlateNumber(plateNumber);
    }
}