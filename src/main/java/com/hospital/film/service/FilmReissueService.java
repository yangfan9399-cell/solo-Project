package com.hospital.film.service;

import com.hospital.film.dto.FilmReissueCreateDTO;
import com.hospital.film.dto.ProcessDTO;
import com.hospital.film.dto.ReviewDTO;
import com.hospital.film.entity.ApplicationHistory;
import com.hospital.film.entity.FilmReissue;
import com.hospital.film.enums.*;
import com.hospital.film.repository.ApplicationHistoryRepository;
import com.hospital.film.repository.AttachmentRepository;
import com.hospital.film.repository.FilmReissueRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FilmReissueService {

    private final FilmReissueRepository filmReissueRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final AttachmentRepository attachmentRepository;

    public FilmReissueService(FilmReissueRepository filmReissueRepository,
                              ApplicationHistoryRepository historyRepository,
                              AttachmentRepository attachmentRepository) {
        this.filmReissueRepository = filmReissueRepository;
        this.historyRepository = historyRepository;
        this.attachmentRepository = attachmentRepository;
    }

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public List<FilmReissue> findAll(String status, String abnormalType, String keyword) {
        Specification<FilmReissue> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), ApplicationStatus.valueOf(status)));
            }
            if (abnormalType != null && !abnormalType.isEmpty()) {
                predicates.add(cb.equal(root.get("abnormalType"), AbnormalType.valueOf(abnormalType)));
            }
            if (keyword != null && !keyword.isEmpty()) {
                Predicate noPredicate = cb.like(root.get("applicationNo"), "%" + keyword + "%");
                Predicate namePredicate = cb.like(root.get("patientName"), "%" + keyword + "%");
                Predicate examPredicate = cb.like(root.get("examNo"), "%" + keyword + "%");
                predicates.add(cb.or(noPredicate, namePredicate, examPredicate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return filmReissueRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public FilmReissue findById(Long id) {
        return filmReissueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请记录不存在"));
    }

    public FilmReissue findByApplicationNo(String applicationNo) {
        return filmReissueRepository.findByApplicationNo(applicationNo)
                .orElseThrow(() -> new RuntimeException("申请记录不存在"));
    }

    @Transactional
    public FilmReissue createApplication(FilmReissueCreateDTO dto) {
        FilmReissue film = new FilmReissue();
        film.setApplicationNo(generateApplicationNo());
        film.setSource(dto.getSource());
        film.setStatus(ApplicationStatus.ACCEPTED);
        film.setAbnormalType(AbnormalType.NORMAL);
        film.setPatientName(dto.getPatientName());
        film.setIdCardNo(dto.getIdCardNo());
        film.setMedicalRecordNo(dto.getMedicalRecordNo());
        film.setExamNo(dto.getExamNo());
        film.setExamItem(dto.getExamItem());
        film.setExamTime(dto.getExamTime());
        film.setExamDepartment(dto.getExamDepartment());
        film.setFilmType(dto.getFilmType());
        film.setFilmCount(dto.getFilmCount());
        film.setFeeAmount(dto.getFeeAmount());
        film.setFeeReceiptNo(dto.getFeeReceiptNo());
        film.setResponsibleParty(dto.getResponsibleParty());
        film.setApplicationReason(dto.getApplicationReason());
        film.setApplicant(dto.getApplicant());
        film.setApplyTime(LocalDateTime.now());
        film.setAcceptTime(LocalDateTime.now());
        film.setCurrentHandler("张经办");
        film.setRemark(dto.getRemark());
        film.setArchived(false);

        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.ACCEPT, "受理申请", "李受理", RoleType.OPERATOR,
                "已受理患者胶片补打申请", null, null, null, null, null, null);

        return film;
    }

    @Transactional
    public FilmReissue processApplication(Long id, ProcessDTO dto) {
        FilmReissue film = findById(id);

        if (film.getArchived()) {
            throw new RuntimeException("已归档记录不能修改");
        }

        String beforeSnapshot = toJsonSnapshot(film);
        String changedFields = detectChangedFields(film, dto);

        film.setPatientName(dto.getPatientName());
        film.setMedicalRecordNo(dto.getMedicalRecordNo());
        film.setExamNo(dto.getExamNo());
        film.setExamItem(dto.getExamItem());
        film.setExamTime(dto.getExamTime());
        film.setExamDepartment(dto.getExamDepartment());
        film.setFilmType(dto.getFilmType());
        film.setFilmCount(dto.getFilmCount());
        film.setFeeAmount(dto.getFeeAmount());
        film.setFeeReceiptNo(dto.getFeeReceiptNo());
        film.setFeePayTime(dto.getFeePayTime());
        film.setResponsibleParty(dto.getResponsibleParty());
        film.setApplicationReason(dto.getApplicationReason());
        film.setConclusion(dto.getConclusion());
        film.setEvidenceBasis(dto.getEvidenceBasis());
        film.setProcessTime(LocalDateTime.now());
        film.setCurrentHandler(dto.getOperator() != null ? dto.getOperator() : "张经办");

        if (dto.getAbnormalType() != null && !dto.getAbnormalType().isEmpty()) {
            AbnormalType abnormalType = AbnormalType.valueOf(dto.getAbnormalType());
            film.setAbnormalType(abnormalType);
            film.setBlockReason(dto.getBlockReason());
            film.setRemedyPath(dto.getRemedyPath());

            if (abnormalType == AbnormalType.MATERIAL_MISSING) {
                film.setDiffFields("关键材料:收费票据原件、身份证明、检查申请单");
            } else if (abnormalType == AbnormalType.RESPONSIBILITY_MISMATCH) {
                film.setDiffFields("责任对象:申请单与系统记录不一致");
            }
        }

        String afterSnapshot = toJsonSnapshot(film);

        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.PROCESS, "业务处理", film.getCurrentHandler(), RoleType.OPERATOR,
                dto.getDescription(), beforeSnapshot, afterSnapshot, changedFields, dto.getEvidenceBasis(),
                film.getBlockReason(), film.getRemedyPath());

        return film;
    }

    @Transactional
    public FilmReissue submitForReview(Long id, String operator) {
        FilmReissue film = findById(id);

        if (film.getArchived()) {
            throw new RuntimeException("已归档记录不能提交复核");
        }

        if (film.getStatus() != ApplicationStatus.PROCESSING && film.getStatus() != ApplicationStatus.REJECTED) {
            if (film.getStatus() != ApplicationStatus.ACCEPTED) {
                throw new RuntimeException("当前状态不允许提交复核");
            }
        }

        film.setStatus(ApplicationStatus.REVIEWING);
        film.setCurrentHandler("王复核");
        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.SUBMIT_REVIEW, "提交复核", operator != null ? operator : "张经办",
                RoleType.OPERATOR, "业务处理完成，提交复核", null, null, null, null, null, null);

        return film;
    }

    @Transactional
    public FilmReissue reviewPass(Long id, ReviewDTO dto) {
        FilmReissue film = findById(id);

        if (film.getArchived()) {
            throw new RuntimeException("已归档记录不能复核");
        }

        if (film.getStatus() != ApplicationStatus.REVIEWING) {
            throw new RuntimeException("当前状态不允许复核");
        }

        String beforeSnapshot = toJsonSnapshot(film);

        film.setStatus(ApplicationStatus.ARCHIVED);
        film.setArchived(true);
        film.setConclusion(dto.getConclusion());
        film.setEvidenceBasis(dto.getEvidenceBasis());
        film.setReviewTime(LocalDateTime.now());
        film.setArchiveTime(LocalDateTime.now());
        film.setCurrentHandler("系统归档");

        String afterSnapshot = toJsonSnapshot(film);

        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.REVIEW_PASS, "复核通过", dto.getOperator() != null ? dto.getOperator() : "王复核",
                RoleType.REVIEWER, dto.getDescription(), beforeSnapshot, afterSnapshot, null, dto.getEvidenceBasis(), null, null);

        addHistory(film, OperationType.ARCHIVE, "归档", "系统",
                RoleType.ADMIN, "复核通过后自动归档", null, null, null, null, null, null);

        return film;
    }

    @Transactional
    public FilmReissue reviewReject(Long id, ReviewDTO dto) {
        FilmReissue film = findById(id);

        if (film.getArchived()) {
            throw new RuntimeException("已归档记录不能退回");
        }

        if (film.getStatus() != ApplicationStatus.REVIEWING) {
            throw new RuntimeException("当前状态不允许退回");
        }

        String beforeSnapshot = toJsonSnapshot(film);

        film.setStatus(ApplicationStatus.REJECTED);
        film.setAbnormalType(AbnormalType.REVIEW_REJECTED);
        film.setBlockReason(dto.getRejectReason());
        film.setRemedyPath(dto.getRemedyPath());
        film.setDiffFields("复核意见与处理结论不一致");
        film.setCurrentHandler("张经办");

        String afterSnapshot = toJsonSnapshot(film);

        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.REVIEW_REJECT, "复核退回", dto.getOperator() != null ? dto.getOperator() : "王复核",
                RoleType.REVIEWER, dto.getDescription(), beforeSnapshot, afterSnapshot, "复核结论",
                dto.getEvidenceBasis(), dto.getRejectReason(), dto.getRemedyPath());

        return film;
    }

    @Transactional
    public FilmReissue reprocess(Long id, String operator) {
        FilmReissue film = findById(id);

        if (!film.getArchived()) {
            throw new RuntimeException("未归档记录无需重新处理");
        }

        film.setStatus(ApplicationStatus.PROCESSING);
        film.setArchived(false);
        film.setCurrentHandler(operator != null ? operator : "张经办");
        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.REPROCESS, "重新处理", operator != null ? operator : "系统",
                RoleType.ADMIN, "归档后重新处理，生成新节点", null, null, null, null, null, null);

        return film;
    }

    @Transactional
    public FilmReissue supplement(Long id, String description, String operator) {
        FilmReissue film = findById(id);

        if (film.getArchived()) {
            throw new RuntimeException("已归档记录不能补充材料");
        }

        film = filmReissueRepository.save(film);

        addHistory(film, OperationType.SUPPLEMENT, "补充材料", operator != null ? operator : "张经办",
                RoleType.OPERATOR, description, null, null, null, null, null, null);

        return film;
    }

    private void addHistory(FilmReissue film, OperationType operationType, String nodeName,
                            String operator, RoleType operatorRole, String description,
                            String beforeSnapshot, String afterSnapshot, String changedFields,
                            String basis, String blockReason, String remedyPath) {
        ApplicationHistory history = new ApplicationHistory();
        history.setFilmReissue(film);
        history.setOperationType(operationType);
        history.setNodeName(nodeName);
        history.setOperator(operator);
        history.setOperatorRole(operatorRole);
        history.setDescription(description);
        history.setBeforeSnapshot(beforeSnapshot);
        history.setAfterSnapshot(afterSnapshot);
        history.setChangedFields(changedFields);
        history.setBasis(basis);
        history.setBlockReason(blockReason);
        history.setRemedyPath(remedyPath);
        history.setNodeOrder(getNextNodeOrder(film.getId()));

        historyRepository.save(history);
    }

    private int getNextNodeOrder(Long filmReissueId) {
        List<ApplicationHistory> histories = historyRepository.findByFilmReissueIdOrderByNodeOrderAsc(filmReissueId);
        return histories.isEmpty() ? 1 : histories.get(histories.size() - 1).getNodeOrder() + 1;
    }

    private String generateApplicationNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = filmReissueRepository.count() + 1;
        return "BP" + dateStr + String.format("%04d", count);
    }

    private String toJsonSnapshot(FilmReissue film) {
        try {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("patientName", film.getPatientName());
            snapshot.put("examNo", film.getExamNo());
            snapshot.put("filmCount", film.getFilmCount());
            snapshot.put("feeAmount", film.getFeeAmount());
            snapshot.put("responsibleParty", film.getResponsibleParty());
            snapshot.put("examTime", film.getExamTime());
            snapshot.put("conclusion", film.getConclusion());
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String detectChangedFields(FilmReissue film, ProcessDTO dto) {
        List<String> changed = new ArrayList<>();

        if (dto.getExamTime() != null && film.getExamTime() != null
                && !dto.getExamTime().equals(film.getExamTime())) {
            changed.add("检查时间");
        }
        if (dto.getResponsibleParty() != null && film.getResponsibleParty() != null
                && !dto.getResponsibleParty().equals(film.getResponsibleParty())) {
            changed.add("责任对象");
        }
        if (dto.getFeeAmount() != null && film.getFeeAmount() != null
                && dto.getFeeAmount().compareTo(film.getFeeAmount()) != 0) {
            changed.add("费用金额");
        }
        if (dto.getFilmCount() != null && film.getFilmCount() != null
                && !dto.getFilmCount().equals(film.getFilmCount())) {
            changed.add("胶片数量");
        }
        if (dto.getConclusion() != null && film.getConclusion() != null
                && !dto.getConclusion().equals(film.getConclusion())) {
            changed.add("处理结论");
        }

        return String.join(", ", changed);
    }

    public List<ApplicationHistory> getHistories(Long id) {
        return historyRepository.findByFilmReissueIdOrderByNodeOrderAsc(id);
    }

    public long count() {
        return filmReissueRepository.count();
    }
}
