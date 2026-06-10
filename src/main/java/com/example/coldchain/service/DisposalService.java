package com.example.coldchain.service;

import com.example.coldchain.entity.DisposalRecord;
import com.example.coldchain.enums.DisposalStatus;
import com.example.coldchain.repository.DisposalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DisposalService {

    private final DisposalRecordRepository disposalRecordRepository;
    private final ExceptionService exceptionService;

    public List<DisposalRecord> findByWaybillId(Long waybillId) {
        return disposalRecordRepository.findByWaybillIdOrderByCreatedAtDesc(waybillId);
    }

    public List<DisposalRecord> findCompletedDisposals() {
        return disposalRecordRepository.findCompletedWithDuration();
    }

    @Transactional
    public DisposalRecord createDisposal(Long exceptionId, Long waybillId, Long handlerId, 
                                         String handlerName, String disposalMethod) {
        DisposalRecord record = new DisposalRecord();
        record.setExceptionId(exceptionId);
        record.setWaybillId(waybillId);
        record.setHandlerId(handlerId);
        record.setHandlerName(handlerName);
        record.setDisposalMethod(disposalMethod);
        record.setStatus(DisposalStatus.PROCESSING);
        return disposalRecordRepository.save(record);
    }

    @Transactional
    public DisposalRecord completeDisposal(Long disposalId, String disposalResult) {
        DisposalRecord record = disposalRecordRepository.findById(disposalId)
                .orElseThrow(() -> new RuntimeException("处置记录不存在"));
        record.setStatus(DisposalStatus.COMPLETED);
        record.setDisposalResult(disposalResult);
        record.setDisposalTime(LocalDateTime.now());
        exceptionService.markAsDisposed(record.getExceptionId());
        return disposalRecordRepository.save(record);
    }
}