package com.hospital.film.repository;

import com.hospital.film.entity.ApplicationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationHistoryRepository extends JpaRepository<ApplicationHistory, Long> {

    List<ApplicationHistory> findByFilmReissueIdOrderByNodeOrderAsc(Long filmReissueId);

    List<ApplicationHistory> findByFilmReissueIdOrderByCreatedAtDesc(Long filmReissueId);
}
