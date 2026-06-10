package com.example.marketstall.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "history_nodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoryNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stall_id", nullable = false)
    private Long stallId;

    @Column(name = "node_type", nullable = false)
    private String nodeType;

    @Column(name = "description")
    private String description;

    @Column(name = "operator")
    private String operator;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
    }
}