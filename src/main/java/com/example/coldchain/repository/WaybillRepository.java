package com.example.coldchain.repository;

import com.example.coldchain.entity.Waybill;
import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.enums.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaybillRepository extends JpaRepository<Waybill, Long> {

    Optional<Waybill> findByWaybillNo(String waybillNo);

    Page<Waybill> findByStatus(WaybillStatus status, Pageable pageable);

    Page<Waybill> findByProductType(ProductType productType, Pageable pageable);

    @Query("SELECT w FROM Waybill w WHERE w.origin = :origin AND w.destination = :destination")
    Page<Waybill> findByRoute(@Param("origin") String origin, @Param("destination") String destination, Pageable pageable);

    @Query("SELECT w FROM Waybill w WHERE w.status IN :statuses")
    List<Waybill> findByStatusIn(@Param("statuses") List<WaybillStatus> statuses);

    @Query("SELECT w FROM Waybill w WHERE w.status = 'EXCEPTION' OR w.status = 'COMPENSATION_PENDING'")
    List<Waybill> findAbnormalWaybills();
}