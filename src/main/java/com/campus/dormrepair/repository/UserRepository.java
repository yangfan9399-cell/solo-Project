package com.campus.dormrepair.repository;

import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByRole(UserRole role);
}
