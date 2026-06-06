-- 清空所有表（按依赖关系倒序）
TRUNCATE TABLE "HistoryLog" CASCADE;
TRUNCATE TABLE "TemperatureReading" CASCADE;
TRUNCATE TABLE "Deviation" CASCADE;
TRUNCATE TABLE "Disposal" CASCADE;
TRUNCATE TABLE "Shipment" CASCADE;
TRUNCATE TABLE "Probe" CASCADE;
TRUNCATE TABLE "Carrier" CASCADE;
TRUNCATE TABLE "Medicine" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- 插入用户
INSERT INTO "User" (id, name, email, role, "createdAt") VALUES
('user-clerk', '张仓库', 'clerk@example.com', 'WAREHOUSE_CLERK', NOW()),
('user-qa', '李质量', 'qa@example.com', 'QUALITY_MANAGER', NOW()),
('user-reviewer', '王复核', 'reviewer@example.com', 'REVIEWER', NOW());

-- 插入药品
INSERT INTO "Medicine" (id, name, category, specification, manufacturer, "minTemp", "maxTemp", "createdAt") VALUES
('med-insulin', '重组人胰岛素注射液', '生物制品', '300U/3ml', '某制药有限公司', 2, 8, NOW()),
('med-vaccine', '新冠灭活疫苗', '疫苗', '0.5ml/支', '某生物科技公司', 2, 8, NOW()),
('med-antibiotic', '注射用头孢曲松钠', '抗生素', '1.0g/瓶', '某医药集团', 0, 25, NOW()),
('med-probiotic', '双歧杆菌三联活菌散', '微生态制剂', '1g/袋', '某生物制药', 2, 8, NOW());

-- 插入承运商
INSERT INTO "Carrier" (id, name, contact, "createdAt") VALUES
('carrier-sf', '顺丰冷运', '400-811-1111', NOW()),
('carrier-jd', '京东冷链', '400-000-8888', NOW()),
('carrier-zto', '中通冷链', '400-827-0270', NOW());

-- 插入探头
INSERT INTO "Probe" (id, "serialNumber", model, status, "createdAt") VALUES
('probe-001', 'PROBE-001', 'TempTale 4', 'ACTIVE', NOW()),
('probe-002', 'PROBE-002', 'TempTale 4', 'ACTIVE', NOW()),
('probe-003', 'PROBE-003', 'LogTag TRIL-8', 'OFFLINE', NOW()),
('probe-004', 'PROBE-004', 'LogTag TRIL-8', 'ACTIVE', NOW());

-- 插入批次1：温度合格
INSERT INTO "Shipment" (id, "batchNumber", "medicineId", quantity, "carrierId", "probeId", "arrivalTime", "warehouseClerkId", status, "currentHandlerId", "createdAt", "updatedAt") VALUES
('shipment-001', 'BATCH-2026-001', 'med-insulin', 500, 'carrier-sf', 'probe-001', NOW(), 'user-clerk', 'DEVIATION_JUDGED', 'user-reviewer', NOW(), NOW());

-- 插入批次2：短时超温
INSERT INTO "Shipment" (id, "batchNumber", "medicineId", quantity, "carrierId", "probeId", "arrivalTime", "warehouseClerkId", status, "currentHandlerId", "createdAt", "updatedAt") VALUES
('shipment-002', 'BATCH-2026-002', 'med-vaccine', 1000, 'carrier-jd', 'probe-002', NOW(), 'user-clerk', 'DEVIATION_JUDGED', 'user-reviewer', NOW(), NOW());

-- 插入批次3：探头离线
INSERT INTO "Shipment" (id, "batchNumber", "medicineId", quantity, "carrierId", "probeId", "arrivalTime", "warehouseClerkId", status, "currentHandlerId", "createdAt", "updatedAt") VALUES
('shipment-003', 'BATCH-2026-003', 'med-antibiotic', 200, 'carrier-zto', 'probe-003', NOW(), 'user-clerk', 'DEVIATION_JUDGED', 'user-reviewer', NOW(), NOW());

-- 插入批次4：批号混装
INSERT INTO "Shipment" (id, "batchNumber", "medicineId", quantity, "carrierId", "probeId", "arrivalTime", "warehouseClerkId", status, "currentHandlerId", "createdAt", "updatedAt") VALUES
('shipment-004', 'BATCH-2026-004', 'med-probiotic', 300, 'carrier-sf', 'probe-004', NOW(), 'user-clerk', 'DEVIATION_JUDGED', 'user-reviewer', NOW(), NOW());

-- 插入批次5：已放行历史记录
INSERT INTO "Shipment" (id, "batchNumber", "medicineId", quantity, "carrierId", "probeId", "arrivalTime", "warehouseClerkId", status, "currentHandlerId", "createdAt", "updatedAt") VALUES
('shipment-005', 'BATCH-2026-005', 'med-insulin', 800, 'carrier-jd', 'probe-001', NOW() - INTERVAL '2 days', 'user-clerk', 'RELEASED', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- 插入批次6：已隔离历史记录
INSERT INTO "Shipment" (id, "batchNumber", "medicineId", quantity, "carrierId", "probeId", "arrivalTime", "warehouseClerkId", status, "currentHandlerId", "createdAt", "updatedAt") VALUES
('shipment-006', 'BATCH-2026-006', 'med-vaccine', 500, 'carrier-zto', 'probe-002', NOW() - INTERVAL '1 day', 'user-clerk', 'ISOLATED', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 生成温度记录的函数
CREATE OR REPLACE FUNCTION generate_temperature_readings(
  p_shipment_id TEXT,
  p_probe_id TEXT,
  p_base_temp FLOAT,
  p_hours INT,
  p_has_excursion BOOLEAN DEFAULT FALSE,
  p_excursion_start INT DEFAULT 2,
  p_excursion_duration FLOAT DEFAULT 1,
  p_excursion_temp FLOAT DEFAULT 10,
  p_has_offline BOOLEAN DEFAULT FALSE,
  p_offline_start INT DEFAULT 4,
  p_offline_duration FLOAT DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  v_i INT;
  v_total_points INT;
  v_timestamp TIMESTAMP;
  v_temperature FLOAT;
  v_is_offline BOOLEAN;
  v_hour_of_trip FLOAT;
  v_start_time TIMESTAMP;
BEGIN
  v_total_points := p_hours * 6 + 1;
  v_start_time := NOW() - (p_hours || ' hours')::INTERVAL;
  
  FOR v_i IN 0..v_total_points LOOP
    v_timestamp := v_start_time + (v_i * 10 || ' minutes')::INTERVAL;
    v_hour_of_trip := v_i::FLOAT / 6;
    v_is_offline := FALSE;
    
    -- 基础温度 + 正弦波动 + 随机噪声
    v_temperature := p_base_temp + SIN(v_i * 0.3) * 0.5 + (RANDOM() - 0.5) * 0.3;
    
    -- 检查是否在离线时间段
    IF p_has_offline AND v_hour_of_trip >= p_offline_start AND v_hour_of_trip < p_offline_start + p_offline_duration THEN
      v_is_offline := TRUE;
      v_temperature := NULL;
    -- 检查是否在超温时间段
    ELSIF p_has_excursion AND v_hour_of_trip >= p_excursion_start AND v_hour_of_trip < p_excursion_start + p_excursion_duration THEN
      v_temperature := p_excursion_temp + (RANDOM() - 0.5) * 0.5;
    END IF;
    
    INSERT INTO "TemperatureReading" (id, "shipmentId", "probeId", timestamp, temperature, "isOffline", "createdAt")
    VALUES (
      gen_random_uuid()::TEXT,
      p_shipment_id,
      p_probe_id,
      v_timestamp,
      v_temperature,
      v_is_offline,
      v_timestamp
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 生成批次1温度数据（温度合格，12小时）
SELECT generate_temperature_readings('shipment-001', 'probe-001', 5, 12);

-- 生成批次2温度数据（短时超温，第3小时开始，持续0.5小时，最高12度）
SELECT generate_temperature_readings('shipment-002', 'probe-002', 5, 12, TRUE, 3, 0.5, 12);

-- 生成批次3温度数据（探头离线，第5小时开始，持续2小时）
SELECT generate_temperature_readings('shipment-003', 'probe-003', 5, 12, FALSE, 0, 0, 0, TRUE, 5, 2);

-- 生成批次4温度数据（温度合格）
SELECT generate_temperature_readings('shipment-004', 'probe-004', 5, 12);

-- 生成批次5温度数据（温度合格，8小时，2天前）
SELECT generate_temperature_readings('shipment-005', 'probe-001', 5, 8);

-- 生成批次6温度数据（严重超温，第2小时开始，持续3小时，最高15度）
SELECT generate_temperature_readings('shipment-006', 'probe-002', 5, 10, TRUE, 2, 3, 15);

-- 插入偏差记录
INSERT INTO "Deviation" (id, "shipmentId", type, level, description, "qualityManagerId", judgment, "judgedAt", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::TEXT, 'shipment-001', 'NONE', 'NONE', '全程温度正常，无偏差', 'user-qa', '温度符合要求，建议放行', NOW(), NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-002', 'TEMPERATURE_EXCEEDED', 'MINOR', '运输途中第 3 小时出现短时超温，最高温度达 12℃，持续约 30 分钟', 'user-qa', '轻微偏差，超温时间较短，需复核人评估后决定是否放行', NOW(), NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-003', 'PROBE_OFFLINE', 'MAJOR', '运输途中探头离线约 2 小时，期间无温度数据，无法确认冷链完整性', 'user-qa', '探头离线属于严重偏差，禁止直接放行，必须要求人工复核证据，确认产品质量', NOW(), NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-004', 'BATCH_MIXED', 'MAJOR', '到货验收时发现包装内混有其他批号产品，存在批号混装问题', 'user-qa', '批号混装属于严重偏差，建议隔离并退回承运商处理', NOW(), NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-005', 'NONE', 'NONE', '全程温度正常', 'user-qa', '合格，建议放行', NOW() - INTERVAL '2 days' + INTERVAL '2 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(gen_random_uuid()::TEXT, 'shipment-006', 'TEMPERATURE_EXCEEDED', 'CRITICAL', '严重超温，最高温度 15℃，持续 3 小时', 'user-qa', '危急偏差，建议隔离并做质量评估', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 插入处置记录
INSERT INTO "Disposal" (id, "shipmentId", action, "reviewerId", comment, "evidenceUrl", "handledAt", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::TEXT, 'shipment-001', 'PENDING', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-002', 'PENDING', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-003', 'PENDING', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-004', 'PENDING', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::TEXT, 'shipment-005', 'RELEASE', 'user-reviewer', '审核通过，予以放行', NULL, NOW() - INTERVAL '2 days' + INTERVAL '4 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(gen_random_uuid()::TEXT, 'shipment-006', 'ISOLATE', 'user-reviewer', '超温严重，决定隔离等待质量评估', NULL, NOW() - INTERVAL '1 day' + INTERVAL '5 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 插入历史记录
INSERT INTO "HistoryLog" (id, "shipmentId", action, "userId", comment, timestamp) VALUES
-- 批次1
(gen_random_uuid()::TEXT, 'shipment-001', '到货登记', 'user-clerk', '批次 BATCH-2026-001 到货，数量 500 支', NOW() - INTERVAL '12 hours'),
(gen_random_uuid()::TEXT, 'shipment-001', '温度采集', 'user-clerk', '温度数据上传完成，共 73 条记录', NOW() - INTERVAL '11 hours'),
(gen_random_uuid()::TEXT, 'shipment-001', '偏差判定', 'user-qa', '无偏差，温度符合 2-8℃ 要求', NOW() - INTERVAL '10 hours'),
-- 批次2
(gen_random_uuid()::TEXT, 'shipment-002', '到货登记', 'user-clerk', '批次 BATCH-2026-002 到货，数量 1000 支', NOW() - INTERVAL '12 hours'),
(gen_random_uuid()::TEXT, 'shipment-002', '温度采集', 'user-clerk', '温度数据上传完成，发现温度异常', NOW() - INTERVAL '11 hours'),
(gen_random_uuid()::TEXT, 'shipment-002', '偏差判定', 'user-qa', '判定为轻微温度超标，持续约 30 分钟', NOW() - INTERVAL '10 hours'),
-- 批次3
(gen_random_uuid()::TEXT, 'shipment-003', '到货登记', 'user-clerk', '批次 BATCH-2026-003 到货，数量 200 瓶', NOW() - INTERVAL '12 hours'),
(gen_random_uuid()::TEXT, 'shipment-003', '温度采集', 'user-clerk', '温度数据上传，发现探头离线记录', NOW() - INTERVAL '11 hours'),
(gen_random_uuid()::TEXT, 'shipment-003', '偏差判定', 'user-qa', '判定为探头离线严重偏差，需人工复核证据', NOW() - INTERVAL '10 hours'),
-- 批次4
(gen_random_uuid()::TEXT, 'shipment-004', '到货登记', 'user-clerk', '批次 BATCH-2026-004 到货，数量 300 袋', NOW() - INTERVAL '12 hours'),
(gen_random_uuid()::TEXT, 'shipment-004', '温度采集', 'user-clerk', '温度数据正常，但发现包装异常', NOW() - INTERVAL '11 hours'),
(gen_random_uuid()::TEXT, 'shipment-004', '偏差判定', 'user-qa', '判定为批号混装严重偏差，建议退回', NOW() - INTERVAL '10 hours'),
-- 批次5
(gen_random_uuid()::TEXT, 'shipment-005', '到货登记', 'user-clerk', '批次 BATCH-2026-005 到货', NOW() - INTERVAL '2 days'),
(gen_random_uuid()::TEXT, 'shipment-005', '偏差判定', 'user-qa', '无偏差', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
(gen_random_uuid()::TEXT, 'shipment-005', '放行', 'user-reviewer', '审核通过，予以放行', NOW() - INTERVAL '2 days' + INTERVAL '4 hours'),
-- 批次6
(gen_random_uuid()::TEXT, 'shipment-006', '到货登记', 'user-clerk', '批次 BATCH-2026-006 到货', NOW() - INTERVAL '1 day'),
(gen_random_uuid()::TEXT, 'shipment-006', '偏差判定', 'user-qa', '危急偏差', NOW() - INTERVAL '1 day' + INTERVAL '3 hours'),
(gen_random_uuid()::TEXT, 'shipment-006', '隔离', 'user-reviewer', '决定隔离', NOW() - INTERVAL '1 day' + INTERVAL '5 hours');

-- 清理函数
DROP FUNCTION generate_temperature_readings;
