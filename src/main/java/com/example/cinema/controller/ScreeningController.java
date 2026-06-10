
package com.example.cinema.controller;

import com.example.cinema.entity.*;
import com.example.cinema.repository.*;
import com.example.cinema.service.InspectionService;
import com.example.cinema.service.InterruptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/screenings")
public class ScreeningController {

    @Autowired
    private ScreeningRepository screeningRepository;

    @Autowired
    private CinemaRepository cinemaRepository;

    @Autowired
    private HallRepository hallRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private InspectionService inspectionService;

    @Autowired
    private InterruptService interruptService;

    @GetMapping
    public String list(Model model) {
        List<Screening> screenings = screeningRepository.findAllWithHallAndMovie();
        model.addAttribute("screenings", screenings);
        return "screening-list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable("id") Long id, Model model) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("场次不存在"));
        
        List<InspectionRecord> inspections = inspectionService.getInspectionRecordsByScreening(id);
        List<InterruptRecord> interrupts = interruptService.getInterruptRecordsByScreening(id);
        
        model.addAttribute("screening", screening);
        model.addAttribute("inspections", inspections);
        model.addAttribute("interrupts", interrupts);
        
        return "screening-detail";
    }

    @GetMapping("/inspect/{id}")
    public String showInspectForm(@PathVariable("id") Long id, Model model) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("场次不存在"));
        
        model.addAttribute("screening", screening);
        model.addAttribute("equipmentStatuses", EquipmentStatus.values());
        
        return "inspection-form";
    }

    @PostMapping("/inspect/{id}")
    public String submitInspection(@PathVariable("id") Long id,
            @RequestParam("inspectorName") String inspectorName,
            @RequestParam("projectorStatus") EquipmentStatus projectorStatus,
            @RequestParam("audioStatus") EquipmentStatus audioStatus,
            @RequestParam("lightingStatus") EquipmentStatus lightingStatus,
            @RequestParam("airConditioningStatus") EquipmentStatus airConditioningStatus,
            @RequestParam("seatingStatus") EquipmentStatus seatingStatus,
            @RequestParam(value = "remarks", required = false) String remarks) {
        
        inspectionService.submitInspection(id, inspectorName, projectorStatus, audioStatus,
                lightingStatus, airConditioningStatus, seatingStatus, remarks);
        
        return "redirect:/screenings/" + id;
    }

    @GetMapping("/interrupt/{id}")
    public String showInterruptForm(@PathVariable("id") Long id, Model model) {
        Screening screening = screeningRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("场次不存在"));
        
        model.addAttribute("screening", screening);
        model.addAttribute("faultTypes", FaultType.values());
        
        return "interrupt-form";
    }

    @PostMapping("/interrupt/{id}")
    public String reportInterrupt(@PathVariable("id") Long id,
            @RequestParam("reporterName") String reporterName,
            @RequestParam("faultType") FaultType faultType,
            @RequestParam("faultDescription") String faultDescription) {
        
        interruptService.reportInterrupt(id, reporterName, faultType, faultDescription);
        
        return "redirect:/screenings/" + id;
    }

    @GetMapping("/create")
    public String showCreateForm(Model model) {
        model.addAttribute("cinemas", cinemaRepository.findAll());
        model.addAttribute("movies", movieRepository.findByIsActiveTrue());
        return "screening-create";
    }

    @GetMapping("/halls")
    @ResponseBody
    public List<Hall> getHallsByCinema(@RequestParam("cinemaId") Long cinemaId) {
        return hallRepository.findByCinemaIdAndIsActiveTrue(cinemaId);
    }

    @PostMapping
    public String createScreening(@RequestParam("cinemaId") Long cinemaId,
            @RequestParam("hallId") Long hallId,
            @RequestParam("movieId") Long movieId,
            @RequestParam("startTime") LocalDateTime startTime,
            @RequestParam("price") java.math.BigDecimal price,
            @RequestParam("totalSeats") Integer totalSeats) {
        
        Hall hall = hallRepository.findById(hallId)
                .orElseThrow(() -> new RuntimeException("影厅不存在"));
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("影片不存在"));
        
        Screening screening = new Screening();
        screening.setHall(hall);
        screening.setMovie(movie);
        screening.setStartTime(startTime);
        screening.setEndTime(startTime.plusMinutes(movie.getDuration()));
        screening.setPrice(price);
        screening.setTotalSeats(totalSeats);
        screening.setAvailableSeats(totalSeats);
        screening.setIsSelling(hall.getEquipmentStatus() == EquipmentStatus.NORMAL);
        screening.setStatus(ScreeningStatus.SCHEDULED);
        
        screeningRepository.save(screening);
        
        return "redirect:/screenings";
    }
}
