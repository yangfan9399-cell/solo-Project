package com.hotel.maintenance.repository;

import com.hotel.maintenance.entity.Room;
import com.hotel.maintenance.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Room findByRoomNumber(String roomNumber);
    List<Room> findByStatus(RoomStatus status);
    List<Room> findByFloor(Integer floor);

    @Query("SELECT DISTINCT r.floor FROM Room r ORDER BY r.floor")
    List<Integer> findDistinctFloors();

    @Query("SELECT DISTINCT r.roomType FROM Room r")
    List<String> findDistinctRoomTypes();
}
