package com.hotel.maintenance.service;

import com.hotel.maintenance.entity.Employee;
import com.hotel.maintenance.enums.Role;
import com.hotel.maintenance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public List<Employee> findAll() {
        return employeeRepository.findAll();
    }

    public Employee findById(Long id) {
        return employeeRepository.findById(id).orElse(null);
    }

    public List<Employee> findByRole(Role role) {
        return employeeRepository.findByRole(role);
    }

    public Employee findByEmployeeNo(String employeeNo) {
        return employeeRepository.findByEmployeeNo(employeeNo);
    }

    public List<Employee> findEngineers() {
        return employeeRepository.findByRole(Role.ENGINEER);
    }

    public List<Employee> findHousekeepingSupervisors() {
        return employeeRepository.findByRole(Role.HOUSEKEEPING_SUPERVISOR);
    }

    public List<Employee> findDutyManagers() {
        return employeeRepository.findByRole(Role.DUTY_MANAGER);
    }

    public List<Employee> findReceptionists() {
        return employeeRepository.findByRole(Role.RECEPTION);
    }
}
