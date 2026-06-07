package com.insurance.claim.service;

import com.insurance.claim.entity.*;
import com.insurance.claim.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    public List<ClaimMaterial> getMissingMaterials(Long caseId) {
        return materialRepository.findByClaimCaseIdAndStatus(caseId, "MISSING");
    }

    @Transactional
    public ClaimMaterial uploadMaterial(Long caseId, Long materialTypeId, String materialName,
                                         String fileName, String filePath, Long uploaderId) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        MaterialType materialType = materialTypeRepository.findById(materialTypeId)
                .orElseThrow(() -> new RuntimeException("材料类型不存在"));

        String operatorName = sysUserRepository.findById(uploaderId)
                .map(SysUser::getRealName).orElse("客户");

        ClaimMaterial material = materialRepository
                .findFirstByClaimCaseIdAndMaterialTypeIdAndStatus(caseId, materialTypeId, "MISSING")
                .orElse(null);

        boolean isResupply = false;
        if (material != null) {
            isResupply = true;
            material.setMaterialName(materialName != null ? materialName : materialType.getTypeName());
            material.setFileName(fileName);
            material.setFilePath(filePath);
            material.setStatus("SUBMITTED");
            material.setUploadedBy(uploaderId);
            material.setUploadTime(LocalDateTime.now());
            material.setReviewRemark(null);
            materialRepository.save(material);

            claimCaseService.addHistory(caseId, "MATERIAL_RESUPPLY", uploaderId, operatorName,
                    "补传材料：" + material.getMaterialName());
        } else {
            boolean hasSubmitted = materialRepository.existsByClaimCaseIdAndMaterialTypeIdAndStatus(
                    caseId, materialTypeId, "SUBMITTED");
            if (hasSubmitted) {
                throw new IllegalStateException("该类型材料已提交，请勿重复上传");
            }

            boolean hasApproved = materialRepository.existsByClaimCaseIdAndMaterialTypeIdAndStatus(
                    caseId, materialTypeId, "APPROVED");
            if (hasApproved) {
                throw new IllegalStateException("该类型材料已审核通过，无需重复上传");
            }

            material = new ClaimMaterial();
            material.setClaimCaseId(caseId);
            material.setMaterialTypeId(materialTypeId);
            material.setMaterialName(materialName != null ? materialName : materialType.getTypeName());
            material.setFileName(fileName);
            material.setFilePath(filePath);
            material.setStatus("SUBMITTED");
            material.setUploadedBy(uploaderId);
            materialRepository.save(material);

            claimCaseService.addHistory(caseId, "MATERIAL_UPLOAD", uploaderId, operatorName,
                    "上传材料：" + material.getMaterialName());
        }

        if ("MATERIAL_MISSING".equals(claimCase.getStatus())) {
            long remainingMissing = materialRepository.findByClaimCaseIdAndStatus(caseId, "MISSING").size();
            if (remainingMissing == 0) {
                claimCase.setStatus("PENDING_REVIEW");
                claimCaseRepository.save(claimCase);
                claimCaseService.addHistory(caseId, "MATERIAL_RESUPPLY_COMPLETE", uploaderId, operatorName,
                        "全部材料补正完成，重新提交核赔");
            } else if (isResupply) {
                claimCaseService.addHistory(caseId, "MATERIAL_RESUPPLY_PARTIAL", uploaderId, operatorName,
                        "部分材料补正完成，仍缺 " + remainingMissing + " 项材料");
            }
        }

        return material;
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
    public int requestMaterialSupplement(Long caseId, List<Long> materialTypeIds, String remark,
                                          Long reviewerId, String reviewerName) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));

        List<String> missingNames = new ArrayList<>();
        for (Long typeId : materialTypeIds) {
            MaterialType materialType = materialTypeRepository.findById(typeId).orElse(null);
            if (materialType == null) continue;

            boolean hasMissing = materialRepository.existsByClaimCaseIdAndMaterialTypeIdAndStatus(
                    caseId, typeId, "MISSING");
            if (hasMissing) continue;

            boolean hasSubmitted = materialRepository.existsByClaimCaseIdAndMaterialTypeIdAndStatus(
                    caseId, typeId, "SUBMITTED");
            if (hasSubmitted) continue;

            boolean hasApproved = materialRepository.existsByClaimCaseIdAndMaterialTypeIdAndStatus(
                    caseId, typeId, "APPROVED");
            if (hasApproved) continue;

            ClaimMaterial missingMaterial = new ClaimMaterial();
            missingMaterial.setClaimCaseId(caseId);
            missingMaterial.setMaterialTypeId(typeId);
            missingMaterial.setMaterialName(materialType.getTypeName());
            missingMaterial.setStatus("MISSING");
            missingMaterial.setUploadedBy(reviewerId);
            missingMaterial.setIsSupplement(true);
            materialRepository.save(missingMaterial);

            missingNames.add(materialType.getTypeName());
        }

        if (missingNames.isEmpty()) {
            return 0;
        }

        claimCase.setStatus("MATERIAL_MISSING");
        claimCaseRepository.save(claimCase);

        String missingStr = String.join("、", missingNames);
        String historyRemark = "材料补正通知，缺失材料：" + missingStr;
        if (remark != null && !remark.isEmpty()) {
            historyRemark += "；备注：" + remark;
        }
        claimCaseService.addHistory(caseId, "MATERIAL_REQUEST", reviewerId, reviewerName, historyRemark);

        return missingNames.size();
    }

    public long countMissingMaterials(Long caseId) {
        return materialRepository.findByClaimCaseIdAndStatus(caseId, "MISSING").size();
    }
}
