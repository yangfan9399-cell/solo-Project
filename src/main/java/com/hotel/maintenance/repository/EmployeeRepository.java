package com.hotel.maintenance.repository;

import com.hotel.maintenance.entity.Employee;
import com.hotel.maintenance.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Employee findByEmployeeNo(String employeeNo);
    List<Employee> findByRole(Role role);
}
