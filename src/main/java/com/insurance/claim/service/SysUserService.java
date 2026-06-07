package com.insurance.claim.service;

import com.insurance.claim.entity.SysUser;
import com.insurance.claim.repository.SysUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SysUserService {

    private final SysUserRepository sysUserRepository;

    public SysUser getDefaultHandler() {
        return sysUserRepository.findByUsername("handler")
                .orElseGet(() -> sysUserRepository.findAll().stream()
                        .filter(u -> "HANDLER".equals(u.getRole()))
                        .findFirst()
                        .orElse(null));
    }

    public SysUser getDefaultReviewer() {
        return sysUserRepository.findByUsername("reviewer")
                .orElseGet(() -> sysUserRepository.findAll().stream()
                        .filter(u -> "REVIEWER".equals(u.getRole()))
                        .findFirst()
                        .orElse(null));
    }

    public SysUser getDefaultCustomer() {
        return sysUserRepository.findByUsername("customer")
                .orElseGet(() -> sysUserRepository.findAll().stream()
                        .filter(u -> "CUSTOMER".equals(u.getRole()))
                        .findFirst()
                        .orElse(null));
    }

    public SysUser getUserById(Long id) {
        return sysUserRepository.findById(id).orElse(null);
    }
}
