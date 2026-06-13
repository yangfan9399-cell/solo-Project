package com.hospital.film.controller;

import com.hospital.film.entity.FilmReissue;
import com.hospital.film.service.FilmReissueService;
import com.hospital.film.service.StatisticsService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@Controller
public class PageController {

    private final FilmReissueService filmReissueService;
    private final StatisticsService statisticsService;

    public PageController(FilmReissueService filmReissueService, StatisticsService statisticsService) {
        this.filmReissueService = filmReissueService;
        this.statisticsService = statisticsService;
    }

    @GetMapping("/")
    public String index() {
        return "redirect:/list";
    }

    @GetMapping("/list")
    public String list(@RequestParam(required = false) String status,
                       @RequestParam(required = false) String abnormalType,
                       @RequestParam(required = false) String keyword,
                       Model model) {
        List<FilmReissue> applications = filmReissueService.findAll(status, abnormalType, keyword);
        model.addAttribute("applications", applications);
        model.addAttribute("status", status);
        model.addAttribute("abnormalType", abnormalType);
        model.addAttribute("keyword", keyword);
        model.addAttribute("stats", statisticsService.getOverviewStats());
        return "list";
    }

    @GetMapping("/detail")
    public String detail(@RequestParam Long id, Model model) {
        FilmReissue film = filmReissueService.findById(id);
        model.addAttribute("film", film);
        model.addAttribute("histories", filmReissueService.getHistories(id));
        return "detail";
    }

    @GetMapping("/process")
    public String process(@RequestParam Long id, Model model) {
        FilmReissue film = filmReissueService.findById(id);
        model.addAttribute("film", film);
        model.addAttribute("histories", filmReissueService.getHistories(id));
        return "process";
    }

    @GetMapping("/review")
    public String review(@RequestParam Long id, Model model) {
        FilmReissue film = filmReissueService.findById(id);
        model.addAttribute("film", film);
        model.addAttribute("histories", filmReissueService.getHistories(id));
        return "review";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        Map<String, Object> stats = statisticsService.getOverviewStats();
        model.addAttribute("stats", stats);
        return "dashboard";
    }

    @GetMapping("/drilldown/status")
    public String drilldownByStatus(@RequestParam String status, Model model) {
        List<FilmReissue> applications = statisticsService.getApplicationsByStatus(status);
        model.addAttribute("applications", applications);
        model.addAttribute("status", status);
        model.addAttribute("abnormalType", "");
        model.addAttribute("keyword", "");
        model.addAttribute("stats", statisticsService.getOverviewStats());
        model.addAttribute("drilldownTitle", "按状态钻取 - " + status);
        return "list";
    }

    @GetMapping("/drilldown/abnormal")
    public String drilldownByAbnormal(@RequestParam String abnormalType, Model model) {
        List<FilmReissue> applications = statisticsService.getApplicationsByAbnormalType(abnormalType);
        model.addAttribute("applications", applications);
        model.addAttribute("status", "");
        model.addAttribute("abnormalType", abnormalType);
        model.addAttribute("keyword", "");
        model.addAttribute("stats", statisticsService.getOverviewStats());
        model.addAttribute("drilldownTitle", "按异常类型钻取 - " + abnormalType);
        return "list";
    }
}
