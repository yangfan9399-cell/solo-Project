package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.SysUser;
import com.bank.due.diligence.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysUserRepository extends JpaRepository<SysUser, Long> {

    Optional<SysUser> findByUsername(String username);

    List<SysUser> findByRole(RoleType role);

    List<SysUser> findByBranchId(Long branchId);
}
