package com.example.marketstall.service;

import com.example.marketstall.entity.Tenant;
import com.example.marketstall.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Tenant getTenantById(Long id) {
        return tenantRepository.findById(id).orElse(null);
    }

    public Tenant getTenantByIdCard(String idCard) {
        return tenantRepository.findByIdCard(idCard);
    }

    public Tenant saveTenant(Tenant tenant) {
        return tenantRepository.save(tenant);
    }

    public void deleteTenant(Long id) {
        tenantRepository.deleteById(id);
    }

    public List<Tenant> searchTenantsByName(String name) {
        return tenantRepository.findByNameContaining(name);
    }
}