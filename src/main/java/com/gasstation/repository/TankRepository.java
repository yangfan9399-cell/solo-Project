package com.gasstation.repository;

import com.gasstation.entity.Tank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TankRepository extends JpaRepository<Tank, Long> {

    List<Tank> findByStationId(Long stationId);

    Tank findByTankCode(String tankCode);
}
