package com.insurance.claim.service;

import com.insurance.claim.entity.*;
import com.insurance.claim.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final ClaimMaterialRepository materialRepository;
    private final MaterialTypeRepository materialTypeRepository;
    private final ClaimCaseRepository claimCaseRepository;
    private final ClaimCaseService claimCaseService;
    private final SysUserRepository sysUserRepository;

    public List<MaterialType> getAllMaterialTypes() {
        return materialTypeRepository.findAll();
    }

    public List<MaterialType> getMaterialTypesByInsuranceType(String insuranceType) {
        return materialTypeRepository.findByInsuranceTypeOrInsuranceTypeIsNullOrderBySortOrder(insuranceType);
    }

    public List<ClaimMaterial> getMaterialsByCaseId(Long caseId) {
        return materialRepository.findByClaimCaseIdOrderByUploadTimeDesc(caseId);
    }

    @Transactional
    public ClaimMaterial uploadMaterial(Long caseId, Long materialTypeId, String materialName,
                                         String fileName, String filePath, Long uploaderId) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        MaterialType materialType = materialTypeRepository.findById(materialTypeId)
                .orElseThrow(() -> new RuntimeException("材料类型不存在"));

        ClaimMaterial material = new ClaimMaterial();
        material.setClaimCaseId(caseId);
        material.setMaterialTypeId(materialTypeId);
        material.setMaterialName(materialName != null ? materialName : materialType.getTypeName());
        material.setFileName(fileName);
        material.setFilePath(filePath);
        material.setStatus("SUBMITTED");
        material.setUploadedBy(uploaderId);

        ClaimMaterial saved = materialRepository.save(material);

        String operatorName = sysUserRepository.findById(uploaderId)
                .map(SysUser::getRealName).orElse("客户");
        claimCaseService.addHistory(caseId, "MATERIAL_UPLOAD", uploaderId, operatorName,
                "上传材料：" + material.getMaterialName());

        if ("MATERIAL_MISSING".equals(claimCase.getStatus())) {
            claimCase.setStatus("PENDING_REVIEW");
            claimCaseRepository.save(claimCase);
            claimCaseService.addHistory(caseId, "MATERIAL_RESUPPLY", uploaderId, operatorName,
                    "材料补正完成，重新提交核赔");
        }

        return saved;
    }

    @Transactional
    public void reviewMaterial(Long materialId, String status, String remark, Long reviewerId) {
        ClaimMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("材料不存在"));
        material.setStatus(status);
        material.setReviewRemark(remark);
        materialRepository.save(material);
    }

    @Transactional
    public void requestMaterialSupplement(Long caseId, String missingMaterials, Long reviewerId, String reviewerName) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));
        claimCase.setStatus("MATERIAL_MISSING");
        claimCaseRepository.save(claimCase);

        claimCaseService.addHistory(caseId, "MATERIAL_REQUEST", reviewerId, reviewerName,
                "材料补正通知，缺失材料：" + missingMaterials);
    }

    public long countMissingMaterials(Long caseId) {
        return materialRepository.findByClaimCaseIdAndStatus(caseId, "MISSING").size();
    }
}
