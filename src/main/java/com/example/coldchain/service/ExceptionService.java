package com.example.coldchain.service;

import com.example.coldchain.entity.ExceptionRecord;
import com.example.coldchain.enums.ExceptionType;
import com.example.coldchain.repository.ExceptionRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExceptionService {

    private final ExceptionRecordRepository exceptionRecordRepository;

    public List<ExceptionRecord> findByWaybillId(Long waybillId) {
        return exceptionRecordRepository.findByWaybillIdOrderByExceptionTimeDesc(waybillId);
    }

    public List<ExceptionRecord> findUndisposedByWaybillId(Long waybillId) {
        return exceptionRecordRepository.findByWaybillIdAndIsDisposedFalse(waybillId);
    }

    public List<ExceptionRecord> findByType(ExceptionType exceptionType) {
        if (exceptionType == null) {
            return exceptionRecordRepository.findAll();
        }
        return exceptionRecordRepository.findByExceptionType(exceptionType);
    }

    public boolean hasUndisposedExceptions(Long waybillId) {
        return !exceptionRecordRepository.findByWaybillIdAndIsDisposedFalse(waybillId).isEmpty();
    }

    @Transactional
    public ExceptionRecord save(ExceptionRecord exceptionRecord) {
        return exceptionRecordRepository.save(exceptionRecord);
    }

    @Transactional
    public void markAsDisposed(Long exceptionId) {
        ExceptionRecord exception = exceptionRecordRepository.findById(exceptionId)
                .orElseThrow(() -> new RuntimeException("异常记录不存在"));
        exception.setIsDisposed(true);
        exceptionRecordRepository.save(exception);
    }
}