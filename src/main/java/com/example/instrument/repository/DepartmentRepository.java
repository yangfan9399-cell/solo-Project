package com.example.instrument.repository;

import com.example.instrument.entity.Department;
import com.example.instrument.entity.Department.DeptType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    Optional<Department> findByDeptCode(String deptCode);
    
    Optional<Department> findByDeptName(String deptName);
    
    List<Department> findByDeptType(DeptType deptType);
    
    List<Department> findByStatus(Boolean status);
}