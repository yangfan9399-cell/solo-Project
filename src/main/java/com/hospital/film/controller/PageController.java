package com.hospital.film.controller;

import com.hospital.film.entity.Attachment;
import com.hospital.film.entity.FilmReissue;
import com.hospital.film.enums.ApplicationSource;
import com.hospital.film.service.FilmReissueService;
import com.hospital.film.service.StatisticsService;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        model.addAttribute("attachments", filmReissueService.getAttachments(id));
        return "detail";
    }

    @GetMapping("/process")
    public String process(@RequestParam Long id, Model model) {
        FilmReissue film = filmReissueService.findById(id);
        model.addAttribute("film", film);
        model.addAttribute("histories", filmReissueService.getHistories(id));
        model.addAttribute("attachments", filmReissueService.getAttachments(id));
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

    @GetMapping("/drilldown/source")
    public String drilldownBySource(@RequestParam String source, Model model) {
        List<FilmReissue> applications = filmReissueService.findAll(null, null, null)
                .stream()
                .filter(f -> f.getSource().name().equals(source))
                .toList();
        model.addAttribute("applications", applications);
        model.addAttribute("status", "");
        model.addAttribute("abnormalType", "");
        model.addAttribute("keyword", "");
        model.addAttribute("stats", statisticsService.getOverviewStats());
        model.addAttribute("drilldownTitle", "按来源钻取 - " + ApplicationSource.valueOf(source).getDescription());
        return "list";
    }

    @GetMapping("/attachment/{id}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) throws IOException {
        Attachment attachment = filmReissueService.getAttachment(id);
        Path filePath = Paths.get(attachment.getFilePath());
        Resource resource = new PathResource(filePath);

        String contentType = attachment.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }
}
