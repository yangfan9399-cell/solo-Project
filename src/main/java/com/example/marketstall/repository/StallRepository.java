package com.example.marketstall.repository;

import com.example.marketstall.entity.Stall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StallRepository extends JpaRepository<Stall, Long> {
    List<Stall> findByArea(String area);
    List<Stall> findByCategory(String category);
    List<Stall> findByStatus(String status);
    List<Stall> findByTenantId(Long tenantId);
    Stall findByStallCode(String stallCode);
    
    @Query("SELECT s.area, COUNT(s) FROM Stall s GROUP BY s.area")
    List<Object[]> countByArea();
    
    @Query("SELECT s.category, COUNT(s) FROM Stall s GROUP BY s.category")
    List<Object[]> countByCategory();
    
    @Query("SELECT s.status, COUNT(s) FROM Stall s GROUP BY s.status")
    List<Object[]> countByStatus();
}