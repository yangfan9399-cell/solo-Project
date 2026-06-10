package com.example.petshipping.controller;

import com.example.petshipping.entity.*;
import com.example.petshipping.enums.BookingStatus;
import com.example.petshipping.enums.PetType;
import com.example.petshipping.repository.FlightRepository;
import com.example.petshipping.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/booking")
@RequiredArgsConstructor
public class BookingController {
    
    private final BookingService bookingService;
    private final FlightRepository flightRepository;
    
    @GetMapping("/list")
    public String list(Model model) {
        List<Booking> bookings = bookingService.findAll();
        model.addAttribute("bookings", bookings);
        return "booking/list";
    }
    
    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("petTypes", PetType.values());
        model.addAttribute("flights", flightRepository.findAll());
        return "booking/create";
    }
    
    @PostMapping("/create")
    public String create(@RequestParam Map<String, String> params) {
        Pet pet = Pet.builder()
                .name(params.get("petName"))
                .petType(PetType.valueOf(params.get("petType")))
                .breed(params.get("petBreed"))
                .age(Integer.parseInt(params.get("petAge")))
                .weight(Double.parseDouble(params.get("petWeight")))
                .color(params.get("petColor"))
                .microchipId(params.get("microchipId"))
                .build();
        
        Owner owner = Owner.builder()
                .name(params.get("ownerName"))
                .idCard(params.get("ownerIdCard"))
                .phone(params.get("ownerPhone"))
                .email(params.get("ownerEmail"))
                .address(params.get("ownerAddress"))
                .build();
        
        Flight flight = flightRepository.findById(Long.parseLong(params.get("flightId")))
                .orElseThrow();
        
        QuarantineCertificate certificate = QuarantineCertificate.builder()
                .certificateNumber(params.get("certificateNumber"))
                .issueDate(LocalDate.parse(params.get("issueDate")))
                .expiryDate(LocalDate.parse(params.get("expiryDate")))
                .issuingAuthority(params.get("issuingAuthority"))
                .vetName(params.get("vetName"))
                .build();
        
        Crate crate = Crate.builder()
                .length(Double.parseDouble(params.get("crateLength")))
                .width(Double.parseDouble(params.get("crateWidth")))
                .height(Double.parseDouble(params.get("crateHeight")))
                .material(params.get("crateMaterial"))
                .hasVentilation("true".equals(params.get("hasVentilation")))
                .hasDripTray("true".equals(params.get("hasDripTray")))
                .build();
        
        bookingService.createBooking(pet, owner, flight, certificate, crate, "客服小王");
        
        return "redirect:/booking/list";
    }
    
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, 
                        @RequestParam(required = false) String errorMessage,
                        Model model) {
        Booking booking = bookingService.findById(id);
        List<BookingHistory> history = bookingService.getBookingHistory(id);
        boolean canCheckIn = bookingService.canCheckIn(id);
        
        model.addAttribute("booking", booking);
        model.addAttribute("history", history);
        model.addAttribute("canCheckIn", canCheckIn);
        model.addAttribute("errorMessage", errorMessage);
        
        return "booking/detail";
    }
    
    @PostMapping("/{id}/verify-certificate")
    public String verifyCertificate(@PathVariable Long id) {
        bookingService.verifyCertificate(id, "检疫员小李");
        return "redirect:/booking/" + id;
    }
    
    @PostMapping("/{id}/reject-certificate")
    public String rejectCertificate(@PathVariable Long id, @RequestParam String reason) {
        bookingService.rejectCertificate(id, "检疫员小李", reason);
        return "redirect:/booking/" + id;
    }
    
    @PostMapping("/{id}/approve-crate")
    public String approveCrate(@PathVariable Long id) {
        bookingService.approveCrate(id, "交运员小张");
        return "redirect:/booking/" + id;
    }
    
    @PostMapping("/{id}/reject-crate")
    public String rejectCrate(@PathVariable Long id, @RequestParam String reason) {
        bookingService.rejectCrate(id, "交运员小张", reason);
        return "redirect:/booking/" + id;
    }
    
    @PostMapping("/{id}/check-in")
    public String checkIn(@PathVariable Long id) {
        bookingService.checkIn(id, "交运员小张");
        return "redirect:/booking/" + id;
    }
    
    @GetMapping("/{id}/rebook")
    public String rebookForm(@PathVariable Long id, Model model) {
        Booking booking = bookingService.findById(id);
        List<Flight> flights = flightRepository.findAll();
        
        model.addAttribute("booking", booking);
        model.addAttribute("flights", flights);
        
        return "booking/rebook";
    }
    
    @PostMapping("/{id}/rebook")
    public String rebook(@PathVariable Long id, @RequestParam Long flightId) {
        Flight newFlight = flightRepository.findById(flightId).orElseThrow();
        bookingService.rebookFlight(id, newFlight, "主管老王");
        return "redirect:/booking/" + id;
    }
    
    @PostMapping("/{id}/cancel")
    public String cancel(@PathVariable Long id) {
        bookingService.cancelBooking(id, "主管老王");
        return "redirect:/booking/list";
    }
    
    @GetMapping("/statistics")
    public String statistics(Model model) {
        List<Booking> bookings = bookingService.findAll();
        
        Map<String, Long> routeStats = new HashMap<>();
        Map<PetType, Long> petTypeStats = new HashMap<>();
        Map<String, Long> exceptionStats = new HashMap<>();
        Map<Integer, Long> rebookingStats = new HashMap<>();
        
        for (Booking booking : bookings) {
            String route = booking.getFlight().getDepartureCity() + " -> " + booking.getFlight().getArrivalCity();
            routeStats.merge(route, 1L, Long::sum);
            
            petTypeStats.merge(booking.getPet().getPetType(), 1L, Long::sum);
            
            if (booking.getStatus() == BookingStatus.CERTIFICATE_EXPIRED) {
                exceptionStats.merge("检疫证明过期", 1L, Long::sum);
            } else if (booking.getStatus() == BookingStatus.CRATE_REJECTED) {
                exceptionStats.merge("航空箱不合规", 1L, Long::sum);
            }
            
            rebookingStats.merge(booking.getRebookingCount(), 1L, Long::sum);
        }
        
        model.addAttribute("routeStats", routeStats);
        model.addAttribute("petTypeStats", petTypeStats);
        model.addAttribute("exceptionStats", exceptionStats);
        model.addAttribute("rebookingStats", rebookingStats);
        model.addAttribute("totalBookings", bookings.size());
        
        return "booking/statistics";
    }
}
