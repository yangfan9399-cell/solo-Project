package com.hospital.film.entity;

import com.hospital.film.enums.OperationType;
import com.hospital.film.enums.RoleType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "application_history")
public class ApplicationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "film_reissue_id", nullable = false)
    private FilmReissue filmReissue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OperationType operationType;

    @Column(length = 50)
    private String nodeName;

    @Column(nullable = false, length = 50)
    private String operator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleType operatorRole;

    @Column(length = 500)
    private String description;

    @Column(length = 1000)
    private String beforeSnapshot;

    @Column(length = 1000)
    private String afterSnapshot;

    @Column(length = 500)
    private String changedFields;

    @Column(length = 500)
    private String basis;

    @Column(length = 200)
    private String blockReason;

    @Column(length = 500)
    private String remedyPath;

    @Column(nullable = false)
    private Integer nodeOrder;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FilmReissue getFilmReissue() { return filmReissue; }
    public void setFilmReissue(FilmReissue filmReissue) { this.filmReissue = filmReissue; }

    public OperationType getOperationType() { return operationType; }
    public void setOperationType(OperationType operationType) { this.operationType = operationType; }

    public String getNodeName() { return nodeName; }
    public void setNodeName(String nodeName) { this.nodeName = nodeName; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public RoleType getOperatorRole() { return operatorRole; }
    public void setOperatorRole(RoleType operatorRole) { this.operatorRole = operatorRole; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBeforeSnapshot() { return beforeSnapshot; }
    public void setBeforeSnapshot(String beforeSnapshot) { this.beforeSnapshot = beforeSnapshot; }

    public String getAfterSnapshot() { return afterSnapshot; }
    public void setAfterSnapshot(String afterSnapshot) { this.afterSnapshot = afterSnapshot; }

    public String getChangedFields() { return changedFields; }
    public void setChangedFields(String changedFields) { this.changedFields = changedFields; }

    public String getBasis() { return basis; }
    public void setBasis(String basis) { this.basis = basis; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }

    public String getRemedyPath() { return remedyPath; }
    public void setRemedyPath(String remedyPath) { this.remedyPath = remedyPath; }

    public Integer getNodeOrder() { return nodeOrder; }
    public void setNodeOrder(Integer nodeOrder) { this.nodeOrder = nodeOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
