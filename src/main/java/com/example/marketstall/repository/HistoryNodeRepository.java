package com.example.marketstall.repository;

import com.example.marketstall.entity.HistoryNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryNodeRepository extends JpaRepository<HistoryNode, Long> {
    List<HistoryNode> findByStallIdOrderByCreatedAtDesc(Long stallId);
    List<HistoryNode> findByNodeType(String nodeType);
}