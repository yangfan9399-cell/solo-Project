package com.gasstation.repository;

import com.gasstation.entity.User;
import com.gasstation.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    User findByUsername(String username);

    List<User> findByRole(UserRole role);

    List<User> findByStationId(Long stationId);
}
