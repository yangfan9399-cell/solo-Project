package com.example.coldchain.repository;

import com.example.coldchain.entity.ExceptionRecord;
import com.example.coldchain.enums.ExceptionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, Long> {

    List<ExceptionRecord> findByWaybillIdOrderByExceptionTimeDesc(Long waybillId);

    List<ExceptionRecord> findByExceptionType(ExceptionType exceptionType);

    List<ExceptionRecord> findByIsDisposed(Boolean isDisposed);

    List<ExceptionRecord> findByWaybillIdAndIsDisposedFalse(Long waybillId);
}