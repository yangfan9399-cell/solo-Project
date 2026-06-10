package com.example.coldchain.repository;

import com.example.coldchain.entity.Compensation;
import com.example.coldchain.enums.CompensationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompensationRepository extends JpaRepository<Compensation, Long> {

    Optional<Compensation> findByWaybillId(Long waybillId);

    List<Compensation> findByStatus(CompensationStatus status);

    List<Compensation> findByStatusIn(List<CompensationStatus> statuses);
}