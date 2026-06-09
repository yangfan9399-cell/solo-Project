package com.fire.inspection.service;

import com.fire.inspection.entity.FireHazard;
import com.fire.inspection.entity.HazardHistory;
import com.fire.inspection.entity.Rectification;
import com.fire.inspection.entity.User;
import com.fire.inspection.enums.HazardStatus;
import com.fire.inspection.repository.FireHazardRepository;
import com.fire.inspection.repository.HazardHistoryRepository;
import com.fire.inspection.repository.RectificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FireHazardService {

    private final FireHazardRepository fireHazardRepository;
    private final HazardHistoryRepository hazardHistoryRepository;
    private final RectificationRepository rectificationRepository;
    private final UserService userService;

    public List<FireHazard> findAll() {
        return fireHazardRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public FireHazard findById(Long id) {
        return fireHazardRepository.findById(id).orElse(null);
    }

    public List<FireHazard> findByStatus(HazardStatus status) {
        return fireHazardRepository.findByStatus(status);
    }

    public List<HazardHistory> getHistory(Long hazardId) {
        return hazardHistoryRepository.findByHazardIdOrderByCreatedAtAsc(hazardId);
    }

    public List<Rectification> getRectifications(Long hazardId) {
        return rectificationRepository.findByHazardIdOrderByCreatedAtDesc(hazardId);
    }

    public long getRemainingDays(FireHazard hazard) {
        if (hazard.getDeadline() == null) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        Duration duration = Duration.between(now, hazard.getDeadline());
        return duration.toDays();
    }

    public boolean isOverdue(FireHazard hazard) {
        if (hazard.getDeadline() == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(hazard.getDeadline())
                && hazard.getStatus() != HazardStatus.ACCEPTED;
    }

    @Transactional
    public FireHazard registerHazard(FireHazard hazard, Long inspectorId) {
        User inspector = userService.findById(inspectorId);
        hazard.setInspector(inspector);
        hazard.setStatus(HazardStatus.REGISTERED);

        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory history = new HazardHistory();
        history.setHazard(saved);
        history.setToStatus(HazardStatus.REGISTERED);
        history.setOperator(inspector);
        history.setRemark("隐患登记");
        hazardHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public FireHazard assignDepartment(Long hazardId, Long departmentHeadId, String department, LocalDateTime deadline) {
        FireHazard hazard = findById(hazardId);
        if (hazard == null) {
            return null;
        }

        User deptHead = userService.findById(departmentHeadId);
        hazard.setResponsibleDepartmentHead(deptHead);
        hazard.setResponsibleDepartment(department);
        hazard.setDeadline(deadline);
        hazard.setStatus(HazardStatus.RECTIFYING);

        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory history = new HazardHistory();
        history.setHazard(saved);
        history.setFromStatus(HazardStatus.REGISTERED);
        history.setToStatus(HazardStatus.RECTIFYING);
        history.setOperator(deptHead);
        history.setRemark("分配责任部门：" + department);
        hazardHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public FireHazard submitRectification(Long hazardId, String description, String photoUrl, Long rectifierId) {
        FireHazard hazard = findById(hazardId);
        if (hazard == null) {
            return null;
        }

        User rectifier = userService.findById(rectifierId);

        Rectification rectification = new Rectification();
        rectification.setHazard(hazard);
        rectification.setDescription(description);
        rectification.setRectificationPhotoUrl(photoUrl);
        rectification.setRectifier(rectifier);
        rectification.setRectifiedAt(LocalDateTime.now());
        rectificationRepository.save(rectification);

        HazardStatus oldStatus = hazard.getStatus();
        hazard.setStatus(HazardStatus.RECTIFIED);
        hazard.setRectifiedAt(LocalDateTime.now());
        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory history = new HazardHistory();
        history.setHazard(saved);
        history.setFromStatus(oldStatus);
        history.setToStatus(HazardStatus.RECTIFIED);
        history.setOperator(rectifier);
        history.setRemark("提交整改申请");
        hazardHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public FireHazard acceptHazard(Long hazardId, Long directorId, String remark) {
        FireHazard hazard = findById(hazardId);
        if (hazard == null) {
            return null;
        }

        User director = userService.findById(directorId);

        HazardStatus oldStatus = hazard.getStatus();
        hazard.setStatus(HazardStatus.ACCEPTED);
        hazard.setAcceptedAt(LocalDateTime.now());
        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory history = new HazardHistory();
        history.setHazard(saved);
        history.setFromStatus(oldStatus);
        history.setToStatus(HazardStatus.ACCEPTED);
        history.setOperator(director);
        history.setRemark("验收通过，隐患销项。" + (remark != null ? remark : ""));
        hazardHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public FireHazard rejectHazard(Long hazardId, Long directorId, String rejectReason) {
        FireHazard hazard = findById(hazardId);
        if (hazard == null) {
            return null;
        }

        User director = userService.findById(directorId);

        HazardStatus oldStatus = hazard.getStatus();
        hazard.setStatus(HazardStatus.REJECTED);
        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory history = new HazardHistory();
        history.setHazard(saved);
        history.setFromStatus(oldStatus);
        history.setToStatus(HazardStatus.REJECTED);
        history.setOperator(director);
        history.setRemark("验收退回：" + rejectReason);
        hazardHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public FireHazard escalateHazard(Long hazardId, Long operatorId) {
        FireHazard hazard = findById(hazardId);
        if (hazard == null) {
            return null;
        }

        HazardStatus oldStatus = hazard.getStatus();
        hazard.setEscalated(true);
        hazard.setStatus(HazardStatus.OVERDUE);
        hazard.setOverdue(true);
        FireHazard saved = fireHazardRepository.save(hazard);

        User operator = userService.findById(operatorId);

        HazardHistory history = new HazardHistory();
        history.setHazard(saved);
        history.setFromStatus(oldStatus);
        history.setToStatus(HazardStatus.OVERDUE);
        history.setOperator(operator);
        history.setRemark("整改超期，已升级处理");
        hazardHistoryRepository.save(history);

        return saved;
    }

    @Transactional
    public void checkAndMarkOverdue() {
        List<FireHazard> overdueList = fireHazardRepository.findOverdueHazards(LocalDateTime.now());
        for (FireHazard hazard : overdueList) {
            HazardStatus oldStatus = hazard.getStatus();
            hazard.setOverdue(true);
            hazard.setStatus(HazardStatus.OVERDUE);
            hazard.setEscalated(true);
            fireHazardRepository.save(hazard);

            HazardHistory history = new HazardHistory();
            history.setHazard(hazard);
            history.setFromStatus(oldStatus);
            history.setToStatus(HazardStatus.OVERDUE);
            history.setRemark("系统检测：整改超期，自动升级");
            hazardHistoryRepository.save(history);
        }
    }

    public long getRectificationDays(FireHazard hazard) {
        if (hazard.getCreatedAt() == null || hazard.getAcceptedAt() == null) {
            return 0;
        }
        Duration duration = Duration.between(hazard.getCreatedAt(), hazard.getAcceptedAt());
        return duration.toDays();
    }
}
