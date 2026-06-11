package com.hotel.maintenance.controller;

import com.hotel.maintenance.entity.Room;
import com.hotel.maintenance.enums.RoomStatus;
import com.hotel.maintenance.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public String list(@RequestParam(required = false) RoomStatus status, Model model) {
        List<Room> rooms;
        if (status != null) {
            rooms = roomService.findByStatus(status);
        } else {
            rooms = roomService.findAll();
        }
        model.addAttribute("rooms", rooms);
        model.addAttribute("statuses", RoomStatus.values());
        model.addAttribute("currentStatus", status);
        return "rooms/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Room room = roomService.findById(id);
        if (room == null) {
            return "redirect:/rooms";
        }
        model.addAttribute("room", room);
        return "rooms/detail";
    }
}
