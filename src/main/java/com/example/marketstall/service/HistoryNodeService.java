package com.example.marketstall.service;

import com.example.marketstall.entity.HistoryNode;
import com.example.marketstall.repository.HistoryNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryNodeService {

    private final HistoryNodeRepository historyNodeRepository;

    public List<HistoryNode> getAllHistoryNodes() {
        return historyNodeRepository.findAll();
    }

    public HistoryNode getHistoryNodeById(Long id) {
        return historyNodeRepository.findById(id).orElse(null);
    }

    public List<HistoryNode> getHistoryNodesByStallId(Long stallId) {
        return historyNodeRepository.findByStallIdOrderByCreatedAtDesc(stallId);
    }

    public HistoryNode saveHistoryNode(HistoryNode node) {
        return historyNodeRepository.save(node);
    }

    public void deleteHistoryNode(Long id) {
        historyNodeRepository.deleteById(id);
    }

    public void addNode(Long stallId, String nodeType, String description, String operator) {
        HistoryNode node = new HistoryNode();
        node.setStallId(stallId);
        node.setNodeType(nodeType);
        node.setDescription(description);
        node.setOperator(operator);
        historyNodeRepository.save(node);
    }
}