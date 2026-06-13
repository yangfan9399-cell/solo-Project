package com.hospital.film.repository;

import com.hospital.film.entity.FilmReissue;
import com.hospital.film.enums.AbnormalType;
import com.hospital.film.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FilmReissueRepository extends JpaRepository<FilmReissue, Long>, JpaSpecificationExecutor<FilmReissue> {

    Optional<FilmReissue> findByApplicationNo(String applicationNo);

    List<FilmReissue> findByStatus(ApplicationStatus status);

    List<FilmReissue> findByAbnormalType(AbnormalType abnormalType);

    @Query("SELECT f.status, COUNT(f) FROM FilmReissue f GROUP BY f.status")
    List<Object[]> countByStatus();

    @Query("SELECT f.abnormalType, COUNT(f) FROM FilmReissue f GROUP BY f.abnormalType")
    List<Object[]> countByAbnormalType();

    @Query("SELECT f.source, COUNT(f) FROM FilmReissue f GROUP BY f.source")
    List<Object[]> countBySource();

    @Query("SELECT FUNCTION('DATE', f.createdAt), COUNT(f) FROM FilmReissue f GROUP BY FUNCTION('DATE', f.createdAt) ORDER BY FUNCTION('DATE', f.createdAt) DESC")
    List<Object[]> countByDate();

    @Query("SELECT SUM(f.feeAmount) FROM FilmReissue f WHERE f.feeAmount IS NOT NULL")
    java.math.BigDecimal sumFeeAmount();

    boolean existsByApplicationNo(String applicationNo);
}
