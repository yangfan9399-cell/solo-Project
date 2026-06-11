package com.hotel.maintenance.service;

import com.hotel.maintenance.entity.Room;
import com.hotel.maintenance.enums.RoomStatus;
import com.hotel.maintenance.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public List<Room> findAll() {
        return roomRepository.findAll();
    }

    public Room findById(Long id) {
        return roomRepository.findById(id).orElse(null);
    }

    public Room findByRoomNumber(String roomNumber) {
        return roomRepository.findByRoomNumber(roomNumber);
    }

    public List<Room> findAvailableRooms() {
        return roomRepository.findByStatus(RoomStatus.AVAILABLE);
    }

    public List<Room> findByStatus(RoomStatus status) {
        return roomRepository.findByStatus(status);
    }

    public List<Integer> getDistinctFloors() {
        return roomRepository.findDistinctFloors();
    }

    public List<String> getDistinctRoomTypes() {
        return roomRepository.findDistinctRoomTypes();
    }

    public Room save(Room room) {
        return roomRepository.save(room);
    }
}
