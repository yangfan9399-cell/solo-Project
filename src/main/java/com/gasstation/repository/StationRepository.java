package com.gasstation.repository;

import com.gasstation.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    Station findByStationCode(String stationCode);
}
