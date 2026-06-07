package com.insurance.claim.service;

import com.insurance.claim.entity.Policy;
import com.insurance.claim.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository policyRepository;

    public Policy getPolicyById(Long id) {
        return policyRepository.findById(id).orElse(null);
    }

    public Policy getPolicyByNo(String policyNo) {
        return policyRepository.findByPolicyNo(policyNo).orElse(null);
    }

    public List<Policy> getAllPolicies() {
        return policyRepository.findAll();
    }

    public Optional<Policy> findByPolicyNo(String policyNo) {
        return policyRepository.findByPolicyNo(policyNo);
    }
}
