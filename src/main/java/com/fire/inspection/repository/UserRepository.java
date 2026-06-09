package com.fire.inspection.repository;

import com.fire.inspection.entity.User;
import com.fire.inspection.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByRole(UserRole role);

    List<User> findByDepartment(String department);
}
