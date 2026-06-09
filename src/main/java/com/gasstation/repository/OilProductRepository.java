package com.gasstation.repository;

import com.gasstation.entity.OilProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OilProductRepository extends JpaRepository<OilProduct, Long> {

    OilProduct findByProductCode(String productCode);
}
