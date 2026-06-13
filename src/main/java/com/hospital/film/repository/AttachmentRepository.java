package com.hospital.film.repository;

import com.hospital.film.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByFilmReissueIdOrderByCreatedAtDesc(Long filmReissueId);
}
