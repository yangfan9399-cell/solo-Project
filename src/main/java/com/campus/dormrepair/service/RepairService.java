package com.campus.dormrepair.service;

import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.entity.RepairHistory;
import com.campus.dormrepair.entity.RepairPart;
import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.FaultType;
import com.campus.dormrepair.enums.RepairStatus;
import com.campus.dormrepair.enums.SatisfactionLevel;
import com.campus.dormrepair.enums.TimeoutReason;
import com.campus.dormrepair.repository.RepairHistoryRepository;
import com.campus.dormrepair.repository.RepairPartRepository;
import com.campus.dormrepair.repository.RepairRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RepairService {

    @Autowired
    private RepairRepository repairRepository;

    @Autowired
    private RepairHistoryRepository historyRepository;

    @Autowired
    private RepairPartRepository partRepository;

    public List<Repair> findAll() {
        return repairRepository.findAllByOrderBySubmitTimeDesc();
    }

    public Optional<Repair> findById(Long id) {
        return repairRepository.findById(id);
    }

    public Optional<Repair> findByOrderNo(String orderNo) {
        return repairRepository.findByOrderNo(orderNo);
    }

    public List<Repair> findByStudentId(Long studentId) {
        return repairRepository.findByStudentIdOrderBySubmitTimeDesc(studentId);
    }

    public List<Repair> findByRepairmanId(Long repairmanId) {
        return repairRepository.findByRepairmanIdOrderBySubmitTimeDesc(repairmanId);
    }

    public List<Repair> findByStatus(RepairStatus status) {
        return repairRepository.findByStatusOrderBySubmitTimeDesc(status);
    }

    public List<RepairHistory> findHistoriesByRepairId(Long repairId) {
        return historyRepository.findByRepairIdOrderByOperateTimeAsc(repairId);
    }

    public List<RepairPart> findPartsByRepairId(Long repairId) {
        return partRepository.findByRepairId(repairId);
    }

    @Transactional
    public Repair submitRepair(String building, String roomNo, FaultType faultType,
                                String description, User student,
                                String studentName, String studentPhone) {
        Repair repair = new Repair();
        repair.setOrderNo("BX" + System.currentTimeMillis());
        repair.setBuilding(building);
        repair.setRoomNo(roomNo);
        repair.setFaultType(faultType);
        repair.setDescription(description);
        repair.setStudent(student);
        repair.setStudentName(studentName);
        repair.setStudentPhone(studentPhone);
        repair.setStatus(RepairStatus.SUBMITTED);
        repair.setSubmitTime(LocalDateTime.now());

        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.SUBMITTED, studentName, "学生提交报修");
        return repair;
    }

    @Transactional
    public Repair assignRepair(Long repairId, User repairman, User dormManager) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() != RepairStatus.SUBMITTED) {
            throw new IllegalStateException("当前状态不允许派单");
        }

        repair.setRepairman(repairman);
        repair.setRepairmanName(repairman.getRealName());
        repair.setDormManager(dormManager);
        repair.setStatus(RepairStatus.ASSIGNED);
        repair.setAssignTime(LocalDateTime.now());

        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.ASSIGNED, dormManager.getRealName(),
                "派单给维修工：" + repairman.getRealName());
        return repair;
    }

    @Transactional
    public Repair startRepair(Long repairId, User repairman) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() != RepairStatus.ASSIGNED
                && repair.getStatus() != RepairStatus.PARTS_SHORTAGE
                && repair.getStatus() != RepairStatus.TIMEOUT) {
            throw new IllegalStateException("当前状态不允许开始维修");
        }

        repair.setStatus(RepairStatus.IN_PROGRESS);
        if (repair.getStartTime() == null) {
            repair.setStartTime(LocalDateTime.now());
        }

        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.IN_PROGRESS, repairman.getRealName(), "开始维修");
        return repair;
    }

    @Transactional
    public Repair markPartsShortage(Long repairId, User repairman, String remark) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() != RepairStatus.IN_PROGRESS) {
            throw new IllegalStateException("当前状态不允许标记配件缺货");
        }

        repair.setStatus(RepairStatus.PARTS_SHORTAGE);
        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.PARTS_SHORTAGE, repairman.getRealName(),
                "配件缺货：" + remark);
        return repair;
    }

    @Transactional
    public Repair markTimeout(Long repairId, TimeoutReason reason, String detail, User operator) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        repair.setStatus(RepairStatus.TIMEOUT);
        repair.setTimeoutReason(reason);
        repair.setTimeoutDetail(detail);

        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.TIMEOUT, operator.getRealName(),
                "维修超时，原因：" + reason.getLabel() + "，详情：" + detail);
        return repair;
    }

    @Transactional
    public Repair completeRepair(Long repairId, User repairman, String repairNote,
                                  String partsUsed, List<RepairPart> parts) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() != RepairStatus.IN_PROGRESS) {
            throw new IllegalStateException("当前状态不允许完成维修");
        }

        LocalDateTime completeTime = LocalDateTime.now();
        repair.setStatus(RepairStatus.COMPLETED);
        repair.setCompleteTime(completeTime);
        repair.setRepairNote(repairNote);
        repair.setPartsUsed(partsUsed);

        if (repair.getStartTime() != null) {
            long minutes = ChronoUnit.MINUTES.between(repair.getStartTime(), completeTime);
            repair.setRepairDurationMinutes(minutes);
        }

        repair = repairRepository.save(repair);

        if (parts != null && !parts.isEmpty()) {
            for (RepairPart part : parts) {
                part.setRepair(repair);
                partRepository.save(part);
            }
        }

        addHistory(repair, RepairStatus.COMPLETED, repairman.getRealName(),
                "维修完成，备注：" + repairNote);
        return repair;
    }

    @Transactional
    public Repair reviewRepair(Long repairId, User reviewer, SatisfactionLevel satisfaction,
                                String reviewComment) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() != RepairStatus.COMPLETED
                && repair.getStatus() != RepairStatus.DISSATISFIED) {
            throw new IllegalStateException("当前状态不允许回访");
        }

        repair.setReviewer(reviewer);
        repair.setSatisfaction(satisfaction);
        repair.setReviewComment(reviewComment);
        repair.setReviewTime(LocalDateTime.now());

        if (satisfaction == SatisfactionLevel.DISSATISFIED
                || satisfaction == SatisfactionLevel.VERY_DISSATISFIED) {
            repair.setStatus(RepairStatus.DISSATISFIED);
            addHistory(repair, RepairStatus.DISSATISFIED, reviewer.getRealName(),
                    "回访不满意，评价：" + satisfaction.getLabel() + "，意见：" + reviewComment);
        } else {
            repair.setStatus(RepairStatus.REVIEWED);
            addHistory(repair, RepairStatus.REVIEWED, reviewer.getRealName(),
                    "回访确认，评价：" + satisfaction.getLabel() + "，意见：" + reviewComment);
        }

        return repairRepository.save(repair);
    }

    @Transactional
    public Repair closeRepair(Long repairId, User operator) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() == RepairStatus.DISSATISFIED) {
            throw new IllegalStateException("学生不满意，禁止直接关闭，请先重新处理");
        }

        if (repair.getStatus() != RepairStatus.REVIEWED) {
            throw new IllegalStateException("当前状态不允许关闭");
        }

        repair.setStatus(RepairStatus.CLOSED);
        repair.setCloseTime(LocalDateTime.now());

        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.CLOSED, operator.getRealName(), "报修已关闭");
        return repair;
    }

    @Transactional
    public Repair reopenRepair(Long repairId, User operator, String reason) {
        Repair repair = repairRepository.findById(repairId)
                .orElseThrow(() -> new IllegalArgumentException("报修单不存在"));

        if (repair.getStatus() != RepairStatus.DISSATISFIED) {
            throw new IllegalStateException("仅不满意状态可重新派单");
        }

        repair.setStatus(RepairStatus.ASSIGNED);
        repair.setStartTime(null);
        repair.setCompleteTime(null);
        repair.setRepairDurationMinutes(null);
        repair.setReviewTime(null);

        repair = repairRepository.save(repair);
        addHistory(repair, RepairStatus.ASSIGNED, operator.getRealName(),
                "学生不满意，重新派单处理，原因：" + reason);
        return repair;
    }

    private void addHistory(Repair repair, RepairStatus status, String operatorName, String remark) {
        RepairHistory history = new RepairHistory();
        history.setRepair(repair);
        history.setStatus(status);
        history.setOperatorName(operatorName);
        history.setRemark(remark);
        history.setOperateTime(LocalDateTime.now());
        historyRepository.save(history);
    }

    public boolean canClose(Repair repair) {
        return repair.getStatus() == RepairStatus.REVIEWED;
    }

    public boolean isDissatisfied(Repair repair) {
        return repair.getStatus() == RepairStatus.DISSATISFIED;
    }
}
