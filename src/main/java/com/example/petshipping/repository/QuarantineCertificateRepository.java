
package com.example.petshipping.repository;

import com.example.petshipping.entity.QuarantineCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuarantineCertificateRepository extends JpaRepository<QuarantineCertificate, Long> {
    Optional<QuarantineCertificate> findByCertificateNumber(String certificateNumber);
}
