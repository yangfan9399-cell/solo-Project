package com.hospital.film.entity;

import com.hospital.film.enums.AbnormalType;
import com.hospital.film.enums.ApplicationSource;
import com.hospital.film.enums.ApplicationStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "film_reissue")
public class FilmReissue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 32)
    private String applicationNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AbnormalType abnormalType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationSource source;

    @Column(nullable = false, length = 50)
    private String patientName;

    @Column(length = 18)
    private String idCardNo;

    @Column(length = 20)
    private String medicalRecordNo;

    @Column(length = 20)
    private String examNo;

    @Column(length = 100)
    private String examItem;

    private LocalDateTime examTime;

    @Column(length = 100)
    private String examDepartment;

    @Column(length = 50)
    private String filmType;

    private Integer filmCount;

    @Column(precision = 10, scale = 2)
    private BigDecimal feeAmount;

    @Column(length = 50)
    private String feeReceiptNo;

    private LocalDateTime feePayTime;

    @Column(length = 50)
    private String responsibleParty;

    @Column(length = 100)
    private String applicationReason;

    @Column(length = 50)
    private String currentHandler;

    @Column(length = 200)
    private String blockReason;

    @Column(length = 500)
    private String diffFields;

    @Column(length = 500)
    private String remedyPath;

    @Column(length = 500)
    private String conclusion;

    @Column(length = 500)
    private String evidenceBasis;

    @Column(length = 50)
    private String applicant;

    private LocalDateTime applyTime;

    private LocalDateTime acceptTime;

    private LocalDateTime processTime;

    private LocalDateTime reviewTime;

    private LocalDateTime archiveTime;

    @Column(length = 50)
    private String receiver;

    private LocalDateTime receiveTime;

    @Column(nullable = false)
    private Boolean archived = false;

    @Column(length = 1000)
    private String remark;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "filmReissue", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<ApplicationHistory> histories = new ArrayList<>();

    @OneToMany(mappedBy = "filmReissue", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<Attachment> attachments = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicationNo() { return applicationNo; }
    public void setApplicationNo(String applicationNo) { this.applicationNo = applicationNo; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public AbnormalType getAbnormalType() { return abnormalType; }
    public void setAbnormalType(AbnormalType abnormalType) { this.abnormalType = abnormalType; }

    public ApplicationSource getSource() { return source; }
    public void setSource(ApplicationSource source) { this.source = source; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getIdCardNo() { return idCardNo; }
    public void setIdCardNo(String idCardNo) { this.idCardNo = idCardNo; }

    public String getMedicalRecordNo() { return medicalRecordNo; }
    public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }

    public String getExamNo() { return examNo; }
    public void setExamNo(String examNo) { this.examNo = examNo; }

    public String getExamItem() { return examItem; }
    public void setExamItem(String examItem) { this.examItem = examItem; }

    public LocalDateTime getExamTime() { return examTime; }
    public void setExamTime(LocalDateTime examTime) { this.examTime = examTime; }

    public String getExamDepartment() { return examDepartment; }
    public void setExamDepartment(String examDepartment) { this.examDepartment = examDepartment; }

    public String getFilmType() { return filmType; }
    public void setFilmType(String filmType) { this.filmType = filmType; }

    public Integer getFilmCount() { return filmCount; }
    public void setFilmCount(Integer filmCount) { this.filmCount = filmCount; }

    public BigDecimal getFeeAmount() { return feeAmount; }
    public void setFeeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; }

    public String getFeeReceiptNo() { return feeReceiptNo; }
    public void setFeeReceiptNo(String feeReceiptNo) { this.feeReceiptNo = feeReceiptNo; }

    public LocalDateTime getFeePayTime() { return feePayTime; }
    public void setFeePayTime(LocalDateTime feePayTime) { this.feePayTime = feePayTime; }

    public String getResponsibleParty() { return responsibleParty; }
    public void setResponsibleParty(String responsibleParty) { this.responsibleParty = responsibleParty; }

    public String getApplicationReason() { return applicationReason; }
    public void setApplicationReason(String applicationReason) { this.applicationReason = applicationReason; }

    public String getCurrentHandler() { return currentHandler; }
    public void setCurrentHandler(String currentHandler) { this.currentHandler = currentHandler; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }

    public String getDiffFields() { return diffFields; }
    public void setDiffFields(String diffFields) { this.diffFields = diffFields; }

    public String getRemedyPath() { return remedyPath; }
    public void setRemedyPath(String remedyPath) { this.remedyPath = remedyPath; }

    public String getConclusion() { return conclusion; }
    public void setConclusion(String conclusion) { this.conclusion = conclusion; }

    public String getEvidenceBasis() { return evidenceBasis; }
    public void setEvidenceBasis(String evidenceBasis) { this.evidenceBasis = evidenceBasis; }

    public String getApplicant() { return applicant; }
    public void setApplicant(String applicant) { this.applicant = applicant; }

    public LocalDateTime getApplyTime() { return applyTime; }
    public void setApplyTime(LocalDateTime applyTime) { this.applyTime = applyTime; }

    public LocalDateTime getAcceptTime() { return acceptTime; }
    public void setAcceptTime(LocalDateTime acceptTime) { this.acceptTime = acceptTime; }

    public LocalDateTime getProcessTime() { return processTime; }
    public void setProcessTime(LocalDateTime processTime) { this.processTime = processTime; }

    public LocalDateTime getReviewTime() { return reviewTime; }
    public void setReviewTime(LocalDateTime reviewTime) { this.reviewTime = reviewTime; }

    public LocalDateTime getArchiveTime() { return archiveTime; }
    public void setArchiveTime(LocalDateTime archiveTime) { this.archiveTime = archiveTime; }

    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }

    public LocalDateTime getReceiveTime() { return receiveTime; }
    public void setReceiveTime(LocalDateTime receiveTime) { this.receiveTime = receiveTime; }

    public Boolean getArchived() { return archived; }
    public void setArchived(Boolean archived) { this.archived = archived; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<ApplicationHistory> getHistories() { return histories; }
    public void setHistories(List<ApplicationHistory> histories) { this.histories = histories; }

    public List<Attachment> getAttachments() { return attachments; }
    public void setAttachments(List<Attachment> attachments) { this.attachments = attachments; }
}
