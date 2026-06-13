package com.hospital.film.controller;

import com.hospital.film.dto.ProcessDTO;
import com.hospital.film.dto.ReviewDTO;
import com.hospital.film.entity.FilmReissue;
import com.hospital.film.service.FilmReissueService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/api")
public class ApplicationController {

    private final FilmReissueService filmReissueService;

    public ApplicationController(FilmReissueService filmReissueService) {
        this.filmReissueService = filmReissueService;
    }

    @PostMapping("/process")
    public String process(@RequestParam Long id, ProcessDTO dto, RedirectAttributes redirectAttributes) {
        try {
            FilmReissue film = filmReissueService.processApplication(id, dto);
            redirectAttributes.addFlashAttribute("message", "处理成功");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "处理失败: " + e.getMessage());
            return "redirect:/process?id=" + id;
        }
    }

    @PostMapping("/submit-review")
    public String submitForReview(@RequestParam Long id,
                                  @RequestParam(required = false) String operator,
                                  RedirectAttributes redirectAttributes) {
        try {
            filmReissueService.submitForReview(id, operator);
            redirectAttributes.addFlashAttribute("message", "已提交复核");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "提交失败: " + e.getMessage());
            return "redirect:/process?id=" + id;
        }
    }

    @PostMapping("/review-pass")
    public String reviewPass(@RequestParam Long id, ReviewDTO dto, RedirectAttributes redirectAttributes) {
        try {
            filmReissueService.reviewPass(id, dto);
            redirectAttributes.addFlashAttribute("message", "复核通过，已归档");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "复核失败: " + e.getMessage());
            return "redirect:/review?id=" + id;
        }
    }

    @PostMapping("/review-reject")
    public String reviewReject(@RequestParam Long id, ReviewDTO dto, RedirectAttributes redirectAttributes) {
        try {
            filmReissueService.reviewReject(id, dto);
            redirectAttributes.addFlashAttribute("message", "已退回补证");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "退回失败: " + e.getMessage());
            return "redirect:/review?id=" + id;
        }
    }

    @PostMapping("/reprocess")
    public String reprocess(@RequestParam Long id,
                            @RequestParam(required = false) String operator,
                            RedirectAttributes redirectAttributes) {
        try {
            filmReissueService.reprocess(id, operator);
            redirectAttributes.addFlashAttribute("message", "已重新处理，生成新节点");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "重新处理失败: " + e.getMessage());
            return "redirect:/detail?id=" + id;
        }
    }

    @PostMapping("/supplement")
    public String supplement(@RequestParam Long id,
                             @RequestParam String description,
                             @RequestParam(required = false) String operator,
                             RedirectAttributes redirectAttributes) {
        try {
            filmReissueService.supplement(id, description, operator);
            redirectAttributes.addFlashAttribute("message", "补充成功");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "补充失败: " + e.getMessage());
            return "redirect:/process?id=" + id;
        }
    }

    @PostMapping("/upload-attachment")
    public String uploadAttachment(@RequestParam Long id,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam(required = false) String description,
                                   @RequestParam(required = false) String operator,
                                   RedirectAttributes redirectAttributes) {
        try {
            if (file.isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "请选择要上传的文件");
                return "redirect:/process?id=" + id;
            }
            filmReissueService.uploadAttachment(id, file, description, operator);
            redirectAttributes.addFlashAttribute("message", "附件上传成功");
            return "redirect:/detail?id=" + id;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "上传失败: " + e.getMessage());
            return "redirect:/process?id=" + id;
        }
    }
}
