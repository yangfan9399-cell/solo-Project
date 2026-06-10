package com.example.marketstall.repository;

import com.example.marketstall.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Tenant findByIdCard(String idCard);
    List<Tenant> findByNameContaining(String name);
    List<Tenant> findByStatus(String status);
}