-- 系统用户表
CREATE TABLE sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 保单表
CREATE TABLE policy (
    id BIGSERIAL PRIMARY KEY,
    policy_no VARCHAR(30) NOT NULL UNIQUE,
    insurance_type VARCHAR(50) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    policyholder VARCHAR(50) NOT NULL,
    insured_person VARCHAR(50) NOT NULL,
    id_card VARCHAR(18) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sum_insured DECIMAL(15,2) NOT NULL,
    premium DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'EFFECTIVE',
    coverage_details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 理赔案件表
CREATE TABLE claim_case (
    id BIGSERIAL PRIMARY KEY,
    case_no VARCHAR(30) NOT NULL UNIQUE,
    policy_id BIGINT NOT NULL REFERENCES policy(id),
    reporter_name VARCHAR(50) NOT NULL,
    reporter_phone VARCHAR(20) NOT NULL,
    accident_date DATE NOT NULL,
    accident_type VARCHAR(50) NOT NULL,
    accident_description TEXT NOT NULL,
    claim_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    frozen BOOLEAN NOT NULL DEFAULT FALSE,
    freeze_reason VARCHAR(200),
    handler_id BIGINT REFERENCES sys_user(id),
    reviewer_id BIGINT REFERENCES sys_user(id),
    register_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 出险信息详情
CREATE TABLE accident_info (
    id BIGSERIAL PRIMARY KEY,
    claim_case_id BIGINT NOT NULL REFERENCES claim_case(id) ON DELETE CASCADE,
    accident_location VARCHAR(200),
    injury_description TEXT,
    diagnosis_result TEXT,
    hospital_name VARCHAR(100),
    treatment_cost DECIMAL(15,2),
    property_loss DECIMAL(15,2),
    other_info TEXT
);

-- 材料类型表
CREATE TABLE material_type (
    id BIGSERIAL PRIMARY KEY,
    type_code VARCHAR(30) NOT NULL UNIQUE,
    type_name VARCHAR(50) NOT NULL,
    insurance_type VARCHAR(50),
    required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0
);

-- 理赔材料表
CREATE TABLE claim_material (
    id BIGSERIAL PRIMARY KEY,
    claim_case_id BIGINT NOT NULL REFERENCES claim_case(id) ON DELETE CASCADE,
    material_type_id BIGINT NOT NULL REFERENCES material_type(id),
    material_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(200),
    file_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    review_remark VARCHAR(200),
    uploaded_by BIGINT REFERENCES sys_user(id),
    upload_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_supplement BOOLEAN NOT NULL DEFAULT FALSE
);

-- 核赔记录表
CREATE TABLE claim_review (
    id BIGSERIAL PRIMARY KEY,
    claim_case_id BIGINT NOT NULL REFERENCES claim_case(id) ON DELETE CASCADE,
    reviewer_id BIGINT REFERENCES sys_user(id),
    review_result VARCHAR(30) NOT NULL,
    liability_judgment TEXT,
    reject_reason VARCHAR(200),
    approved_amount DECIMAL(15,2),
    review_remark TEXT,
    review_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 案件历史节点表
CREATE TABLE claim_history (
    id BIGSERIAL PRIMARY KEY,
    claim_case_id BIGINT NOT NULL REFERENCES claim_case(id) ON DELETE CASCADE,
    operation_type VARCHAR(30) NOT NULL,
    operator_id BIGINT REFERENCES sys_user(id),
    operator_name VARCHAR(50),
    remark TEXT,
    operation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 关联案件表（重复报案）
CREATE TABLE related_claim (
    id BIGSERIAL PRIMARY KEY,
    main_case_id BIGINT NOT NULL REFERENCES claim_case(id) ON DELETE CASCADE,
    related_case_id BIGINT NOT NULL REFERENCES claim_case(id) ON DELETE CASCADE,
    relation_type VARCHAR(30) NOT NULL DEFAULT 'DUPLICATE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(main_case_id, related_case_id)
);

-- 索引
CREATE INDEX idx_claim_case_policy ON claim_case(policy_id);
CREATE INDEX idx_claim_case_status ON claim_case(status);
CREATE INDEX idx_claim_case_accident_date ON claim_case(accident_date);
CREATE INDEX idx_claim_material_case ON claim_material(claim_case_id);
CREATE INDEX idx_claim_history_case ON claim_history(claim_case_id);
CREATE INDEX idx_related_claim_main ON related_claim(main_case_id);
CREATE INDEX idx_related_claim_related ON related_claim(related_case_id);
