PRAGMA foreign_keys = OFF;

DELETE FROM StockAlert;
DELETE FROM StockEntryItem;
DELETE FROM StockEntry;
DELETE FROM InspectionItem;
DELETE FROM Inspection;
DELETE FROM DistributionItem;
DELETE FROM Distribution;
DELETE FROM ApplicationItem;
DELETE FROM Application;
DELETE FROM ExceptionRecord;
DELETE FROM Stock;
DELETE FROM DonationMaterial;
DELETE FROM DonationBatch;
DELETE FROM Recipient;
DELETE FROM Material;
DELETE FROM User;

BEGIN TRANSACTION;

INSERT INTO User (id, username, password, name, role, phone, email, createdAt, updatedAt) VALUES
  ('u_admin', 'admin', '$2a$10$WUT3RAt3pWooKTYKQikwpOelogGVfnJsa1NxxHnA8TzH.MMLkHNoW', '张管理员', 'ADMIN', '13800138001', 'admin@charity.org', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('u_worker', 'worker', '$2a$10$WUT3RAt3pWooKTYKQikwpOelogGVfnJsa1NxxHnA8TzH.MMLkHNoW', '李社工', 'SOCIAL_WORKER', '13800138002', 'worker@charity.org', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('u_manager', 'manager', '$2a$10$WUT3RAt3pWooKTYKQikwpOelogGVfnJsa1NxxHnA8TzH.MMLkHNoW', '王负责人', 'MANAGER', '13800138003', 'manager@charity.org', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

INSERT INTO Material (id, name, category, unit, description, specs, createdAt, updatedAt) VALUES
  ('m_rice', '大米', '食品', '袋', '5kg装大米', '5kg/袋', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_oil', '食用油', '食品', '桶', '5L装食用油', '5L/桶', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_flour', '面粉', '食品', '袋', '5kg装面粉', '5kg/袋', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_milk', '牛奶', '食品', '箱', '纯牛奶', '250ml*24盒', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_quilt', '棉被', '衣物', '床', '冬季棉被', '200*230cm', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_jacket', '羽绒服', '衣物', '件', '成人羽绒服', 'M/L/XL', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_mask', '口罩', '医疗', '包', '一次性医用口罩', '50只/包', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_sanitizer', '消毒液', '医疗', '瓶', '75%酒精消毒液', '500ml/瓶', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_bag', '书包', '文具', '个', '学生书包', '标准款', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('m_notebook', '笔记本', '文具', '本', '学生笔记本', 'A5 100页', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

INSERT INTO Recipient (id, name, idCard, phone, address, category, description, isVerified, createdAt, updatedAt) VALUES
  ('r_chen', '陈大爷', '110101195001011234', '13900139001', '北京市朝阳区幸福小区1号楼101室', '低保户', '独居老人，无子女', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('r_liu', '刘阿姨', '110101195502022345', '13900139002', '北京市朝阳区幸福小区2号楼202室', '低保户', '残疾人，行动不便', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('r_wangxm', '王小明', '110101201003033456', '13900139003', '北京市海淀区希望小学宿舍', '困境儿童', '父母双亡，由祖父母抚养', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('r_zhangxh', '张小花', '110101201204044567', '13900139004', '北京市海淀区希望小学宿舍', '困境儿童', '单亲家庭，母亲患病', 0, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
  ('r_zhao', '赵师傅', '110101197005055678', '13900139005', '北京市丰台区爱心家园', '困难职工', '下岗工人，打零工', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

INSERT INTO DonationBatch (id, batchNo, donorName, donorPhone, donorEmail, description, status, totalItems, totalValue, receivedAt, createdBy, createdAt, updatedAt) VALUES
  ('b1', 'DON-2024-0001', '爱心企业A有限公司', '010-88888888', 'contact@companya.com', '春节慰问物资捐赠', 'STORED', 500, 25000, '2024-01-15T00:00:00.000Z', 'u_admin', '2024-01-15T00:00:00.000Z', '2024-01-15T00:00:00.000Z'),
  ('b2', 'DON-2024-0002', '阳光公益基金会', '010-66666666', NULL, '开学季文具捐赠', 'PENDING', 600, 18000, '2024-02-20T00:00:00.000Z', 'u_admin', '2024-02-20T00:00:00.000Z', '2024-02-20T00:00:00.000Z'),
  ('b3', 'DON-2024-0003', '市民张先生', '13800138888', NULL, '个人爱心捐赠', 'INSPECTING', 50, 7500, '2024-02-25T00:00:00.000Z', 'u_worker', '2024-02-25T00:00:00.000Z', '2024-02-25T00:00:00.000Z');

INSERT INTO DonationMaterial (id, batchId, materialId, quantity, unitPrice, remark, createdAt) VALUES
  ('dm1', 'b1', 'm_rice', 200, 50, '东北优质大米', '2024-01-15T00:00:00.000Z'),
  ('dm2', 'b1', 'm_oil', 150, 80, '金龙鱼食用油', '2024-01-15T00:00:00.000Z'),
  ('dm3', 'b1', 'm_quilt', 150, 120, '恒源祥棉被', '2024-01-15T00:00:00.000Z'),
  ('dm4', 'b2', 'm_bag', 300, 40, '双肩书包', '2024-02-20T00:00:00.000Z'),
  ('dm5', 'b2', 'm_notebook', 300, 20, '牛皮纸笔记本', '2024-02-20T00:00:00.000Z'),
  ('dm6', 'b3', 'm_jacket', 50, 150, '品牌羽绒服', '2024-02-25T00:00:00.000Z');

INSERT INTO Inspection (id, batchId, inspectorId, result, remark, inspectionDate, createdAt) VALUES
  ('insp1', 'b1', 'u_admin', 'PASSED', '全部合格，包装完好', '2024-01-16T00:00:00.000Z', '2024-01-16T00:00:00.000Z');

INSERT INTO InspectionItem (id, inspectionId, donationMaterialId, quantity, qualifiedQty, result, remark) VALUES
  ('ii1', 'insp1', 'dm1', 200, 200, 'PASSED', NULL),
  ('ii2', 'insp1', 'dm2', 150, 150, 'PASSED', NULL),
  ('ii3', 'insp1', 'dm3', 150, 150, 'PASSED', NULL);

INSERT INTO StockEntry (id, entryNo, batchId, entryBy, entryDate, remark, createdAt) VALUES
  ('se1', 'IN-2024-0001', 'b1', 'u_admin', '2024-01-17T00:00:00.000Z', 'A区仓库入库', '2024-01-17T00:00:00.000Z');

INSERT INTO StockEntryItem (id, entryId, donationMaterialId, materialId, quantity, warehouseLocation) VALUES
  ('sei1', 'se1', 'dm1', 'm_rice', 200, 'A区'),
  ('sei2', 'se1', 'dm2', 'm_oil', 150, 'A区'),
  ('sei3', 'se1', 'dm3', 'm_quilt', 150, 'A区');

INSERT INTO Stock (id, materialId, quantity, reservedQty, availableQty, minWarningQty, warehouseLocation, updatedAt) VALUES
  ('stk_rice', 'm_rice', 200, 2, 198, 20, 'A区', '2024-01-17T00:00:00.000Z'),
  ('stk_oil', 'm_oil', 150, 1, 149, 20, 'A区', '2024-01-17T00:00:00.000Z'),
  ('stk_quilt', 'm_quilt', 150, 1, 149, 20, 'A区', '2024-01-17T00:00:00.000Z'),
  ('stk_flour', 'm_flour', 5, 0, 5, 20, 'A区', '2024-01-17T00:00:00.000Z');

INSERT INTO Application (id, appNo, recipientId, applicantId, title, description, status, appliedAt, approvedAt, approvedBy, approveRemark, createdAt, updatedAt) VALUES
  ('app1', 'APP-2024-0001', 'r_chen', 'u_worker', '春节物资申请', '陈大爷春节慰问物资申请', 'DISTRIBUTED', '2024-01-20T00:00:00.000Z', '2024-01-21T00:00:00.000Z', 'u_manager', '同意发放', '2024-01-20T00:00:00.000Z', '2024-01-22T00:00:00.000Z'),
  ('app2', 'APP-2024-0002', 'r_liu', 'u_worker', '春节物资申请', '刘阿姨春节慰问物资申请', 'APPROVED', '2024-01-20T00:00:00.000Z', '2024-01-21T00:00:00.000Z', 'u_manager', '同意发放', '2024-01-20T00:00:00.000Z', '2024-01-21T00:00:00.000Z'),
  ('app3', 'APP-2024-0003', 'r_wangxm', 'u_worker', '开学文具申请', '王小明同学开学文具申请', 'PENDING', '2024-02-20T00:00:00.000Z', NULL, NULL, NULL, '2024-02-20T00:00:00.000Z', '2024-02-20T00:00:00.000Z'),
  ('app4', 'APP-2024-0004', 'r_zhangxh', 'u_worker', '开学文具申请', '张小花同学开学文具申请', 'REJECTED', '2024-02-18T00:00:00.000Z', '2024-02-19T00:00:00.000Z', 'u_manager', '材料不完整，请补充家庭情况证明', '2024-02-18T00:00:00.000Z', '2024-02-19T00:00:00.000Z');

INSERT INTO ApplicationItem (id, applicationId, materialId, requestedQty, approvedQty, remark) VALUES
  ('ai1', 'app1', 'm_rice', 2, 2, '大米'),
  ('ai2', 'app1', 'm_oil', 1, 1, '食用油'),
  ('ai3', 'app1', 'm_quilt', 1, 1, '棉被'),
  ('ai4', 'app2', 'm_rice', 2, 2, '大米'),
  ('ai5', 'app2', 'm_oil', 1, 1, '食用油'),
  ('ai6', 'app3', 'm_bag', 1, NULL, '书包'),
  ('ai7', 'app3', 'm_notebook', 5, NULL, '笔记本'),
  ('ai8', 'app4', 'm_bag', 1, NULL, '书包'),
  ('ai9', 'app4', 'm_notebook', 5, NULL, '笔记本');

INSERT INTO Distribution (id, distNo, applicationId, distributorId, status, shippedAt, deliveredAt, signedAt, signedBy, signRemark, createdAt, updatedAt) VALUES
  ('dist1', 'DIST-2024-0001', 'app1', 'u_worker', 'SIGNED', '2024-01-22T00:00:00.000Z', '2024-01-22T00:00:00.000Z', '2024-01-22T00:00:00.000Z', '陈大爷', '已收到全部物资，感谢', '2024-01-22T00:00:00.000Z', '2024-01-22T00:00:00.000Z');

INSERT INTO DistributionItem (id, distributionId, materialId, quantity, actualQty, remark) VALUES
  ('di1', 'dist1', 'm_rice', 2, 2, NULL),
  ('di2', 'dist1', 'm_oil', 1, 1, NULL),
  ('di3', 'dist1', 'm_quilt', 1, 1, NULL);

INSERT INTO ExceptionRecord (id, exceptionNo, type, title, description, status, relatedBatchId, relatedDistId, reportedBy, processedBy, processedAt, resolution, createdAt, updatedAt) VALUES
  ('exc1', 'EXC-2024-0001', 'QUALITY_ISSUE', '部分棉被有破损', '在质检过程中发现有3床棉被外包装破损，需要确认内部是否完好', 'PROCESSING', 'b1', NULL, 'u_admin', 'u_admin', '2024-01-16T00:00:00.000Z', '正在联系捐赠方协商退换', '2024-01-16T00:00:00.000Z', '2024-01-16T00:00:00.000Z'),
  ('exc2', 'EXC-2024-0002', 'QUANTITY_MISMATCH', '物资数量不符', '捐赠清单显示食用油150桶，实际清点只有148桶', 'RESOLVED', 'b1', NULL, 'u_admin', 'u_manager', '2024-01-17T00:00:00.000Z', '与捐赠方确认，确实少发2桶，已按148桶入库', '2024-01-16T00:00:00.000Z', '2024-01-17T00:00:00.000Z');

INSERT INTO StockAlert (id, stockId, alertType, message, threshold, currentQty, isRead, createdAt) VALUES
  ('sa1', 'stk_flour', 'LOW_STOCK', '面粉库存不足预警', 20, 5, 0, '2024-01-17T00:00:00.000Z');

COMMIT;

PRAGMA foreign_keys = ON;
