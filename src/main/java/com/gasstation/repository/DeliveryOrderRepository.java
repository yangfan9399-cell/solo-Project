package com.gasstation.repository;

import com.gasstation.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {

    List<DeliveryOrder> findByTankIdAndDeliveryDateBetween(Long tankId, LocalDate startDate, LocalDate endDate);

    DeliveryOrder findByDeliveryNo(String deliveryNo);
}
