package com.gasstation.service;

import com.gasstation.entity.*;
import com.gasstation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MasterDataService {

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private TankRepository tankRepository;

    @Autowired
    private OilProductRepository oilProductRepository;

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    public List<Tank> getAllTanks() {
        return tankRepository.findAll();
    }

    public List<Tank> getTanksByStation(Long stationId) {
        return tankRepository.findByStationId(stationId);
    }

    public List<OilProduct> getAllProducts() {
        return oilProductRepository.findAll();
    }

    public List<User> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public Tank getTankById(Long id) {
        return tankRepository.findById(id).orElse(null);
    }

    public Station getStationById(Long id) {
        return stationRepository.findById(id).orElse(null);
    }

    public OilProduct getProductById(Long id) {
        return oilProductRepository.findById(id).orElse(null);
    }

    public List<DeliveryOrder> getDeliveryOrdersByTankAndDate(Long tankId,
                                                               java.time.LocalDate startDate,
                                                               java.time.LocalDate endDate) {
        return deliveryOrderRepository.findByTankIdAndDeliveryDateBetween(tankId, startDate, endDate);
    }
}
