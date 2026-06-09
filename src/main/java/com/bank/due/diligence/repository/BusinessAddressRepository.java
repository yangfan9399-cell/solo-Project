package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.BusinessAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessAddressRepository extends JpaRepository<BusinessAddress, Long> {

    List<BusinessAddress> findByEnterpriseId(Long enterpriseId);
}
