import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const U = {
  zhangwei:  'a0000001-0000-0000-0000-000000000001',
  lina:      'a0000002-0000-0000-0000-000000000002',
  wangqiang: 'a0000003-0000-0000-0000-000000000003',
  zhaomin:   'a0000004-0000-0000-0000-000000000004',
  chengang:  'a0000005-0000-0000-0000-000000000005',
};

const V = {
  jingA: 'b0000001-0000-0000-0000-000000000001',
  jingB: 'b0000002-0000-0000-0000-000000000002',
  jingC: 'b0000003-0000-0000-0000-000000000003',
  jingD: 'b0000004-0000-0000-0000-000000000004',
};

const R = {
  normal:       'c0000001-0000-0000-0000-000000000001',
  ineligible:   'c0000002-0000-0000-0000-000000000002',
  timeConflict: 'c0000003-0000-0000-0000-000000000003',
  unconfirmed:  'c0000004-0000-0000-0000-000000000004',
};

const N = {
  n1_created:  'd0000101-0000-0000-0000-000000000001',
  n1_assigned: 'd0000102-0000-0000-0000-000000000002',
  n1_process:  'd0000103-0000-0000-0000-000000000003',
  n1_review:   'd0000104-0000-0000-0000-000000000004',
  n2_created:  'd0000201-0000-0000-0000-000000000005',
  n2_assigned: 'd0000202-0000-0000-0000-000000000006',
  n2_process:  'd0000203-0000-0000-0000-000000000007',
  n2_inelig:   'd0000204-0000-0000-0000-000000000008',
  n3_created:  'd0000301-0000-0000-0000-000000000009',
  n3_assigned: 'd0000302-0000-0000-0000-000000000010',
  n3_process:  'd0000303-0000-0000-0000-000000000011',
  n3_conflict: 'd0000304-0000-0000-0000-000000000012',
  n4_created:  'd0000401-0000-0000-0000-000000000013',
  n4_assigned: 'd0000402-0000-0000-0000-000000000014',
};

const B = {
  tripDesc: 'e0000001-0000-0000-0000-000000000001',
};

const E = {
  signDoc: 'f0000001-0000-0000-0000-000000000001',
};

const VI = {
  speeding:     'g0000001-0000-0000-0000-000000000001',
  illegalPark:  'g0000002-0000-0000-0000-000000000002',
};

const diffFields2 = JSON.stringify([
  { field: 'actualMileage', oldValue: '300', newValue: '450' },
]);

const diffFields3 = JSON.stringify([
  { field: 'usageStartTime', oldValue: '2024-01-15T09:00:00', newValue: '2024-01-15T08:30:00' },
  { field: 'usageEndTime', oldValue: '2024-01-15T17:00:00', newValue: '2024-01-15T18:30:00' },
]);

const changedFields2 = diffFields2;

const snapshot1_created  = JSON.stringify({ status: 'RECEIVED', appliedMileage: 150, actualMileage: 150, currentAssigneeId: null });
const snapshot1_assigned = JSON.stringify({ status: 'RECEIVED', appliedMileage: 150, actualMileage: 150, currentAssigneeId: U.wangqiang });
const snapshot1_process  = JSON.stringify({ status: 'PROCESSING', appliedMileage: 150, actualMileage: 148, currentAssigneeId: U.wangqiang });
const snapshot1_review   = JSON.stringify({ status: 'REVIEW', appliedMileage: 150, actualMileage: 148, currentAssigneeId: U.wangqiang });

const snapshot2_created  = JSON.stringify({ status: 'RECEIVED', appliedMileage: 300, actualMileage: 300, currentAssigneeId: null });
const snapshot2_assigned = JSON.stringify({ status: 'RECEIVED', appliedMileage: 300, actualMileage: 300, currentAssigneeId: U.wangqiang });
const snapshot2_process  = JSON.stringify({ status: 'PROCESSING', appliedMileage: 300, actualMileage: 450, currentAssigneeId: U.wangqiang });
const snapshot2_inelig   = JSON.stringify({ status: 'PROCESSING', appliedMileage: 300, actualMileage: 450, currentAssigneeId: U.wangqiang, blockingReason: '申请人未取得货车驾驶资格证，实际驾驶人与登记不符' });

const snapshot3_created  = JSON.stringify({ status: 'RECEIVED', appliedMileage: 80, actualMileage: 80, currentAssigneeId: null });
const snapshot3_assigned = JSON.stringify({ status: 'RECEIVED', appliedMileage: 80, actualMileage: 80, currentAssigneeId: U.zhaomin });
const snapshot3_process  = JSON.stringify({ status: 'PROCESSING', appliedMileage: 80, actualMileage: 80, currentAssigneeId: U.zhaomin });
const snapshot3_conflict = JSON.stringify({ status: 'PROCESSING', appliedMileage: 80, actualMileage: 80, currentAssigneeId: U.zhaomin, blockingReason: '用车时间与京C11111已有调度记录冲突' });

const snapshot4_created  = JSON.stringify({ status: 'RECEIVED', appliedMileage: 60, actualMileage: 60, currentAssigneeId: null });
const snapshot4_assigned = JSON.stringify({ status: 'RECEIVED', appliedMileage: 60, actualMileage: 60, currentAssigneeId: U.lina });

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🧹 清理数据库...');
    const cleanupTables = [
      'ViolationInfo',
      'EvidenceAttachment',
      'OnSiteExplanation',
      'BusinessRecord',
      'ProcessingNode',
      'VehicleUsageRecord',
      'Vehicle',
      'User',
    ];
    for (const table of cleanupTables) {
      await client.query(`DELETE FROM "${table}"`);
    }
    console.log('✅ 数据库清理完成');

    console.log('👤 插入用户数据...');
    await client.query(`
      INSERT INTO "User" ("id", "name", "role", "department", "createdAt") VALUES
        ('${U.zhangwei}',  '张伟', 'FRONTLINE',    '运营部', '2024-01-01T00:00:00Z'),
        ('${U.lina}',      '李娜', 'FRONTLINE',    '运输部', '2024-01-01T00:00:00Z'),
        ('${U.wangqiang}', '王强', 'QC_REVIEWER',  '质控部', '2024-01-01T00:00:00Z'),
        ('${U.zhaomin}',   '赵敏', 'QC_REVIEWER',  '质控部', '2024-01-01T00:00:00Z'),
        ('${U.chengang}',  '陈刚', 'ADMIN',        '管理部', '2024-01-01T00:00:00Z')
    `);
    console.log('✅ 5个用户插入完成');

    console.log('🚗 插入车辆数据...');
    await client.query(`
      INSERT INTO "Vehicle" ("id", "plateNumber", "vehicleType", "department", "status", "createdAt") VALUES
        ('${V.jingA}', '京A12345', '商务车', '行政部', 'ACTIVE', '2024-01-01T00:00:00Z'),
        ('${V.jingB}', '京B67890', '货车',   '运输部', 'ACTIVE', '2024-01-01T00:00:00Z'),
        ('${V.jingC}', '京C11111', '轿车',   '销售部', 'ACTIVE', '2024-01-01T00:00:00Z'),
        ('${V.jingD}', '京D22222', 'SUV',    '运营部', 'ACTIVE', '2024-01-01T00:00:00Z')
    `);
    console.log('✅ 4辆车插入完成');

    console.log('📋 插入车辆使用记录...');
    await client.query(`
      INSERT INTO "VehicleUsageRecord" (
        "id", "title", "applicantId", "vehicleId", "status", "sampleType",
        "appliedMileage", "actualMileage", "usageStartTime", "usageEndTime",
        "actualStartTime", "actualEndTime", "purpose", "department",
        "currentAssigneeId", "blockingReason", "remediationPath", "diffFields",
        "conclusion", "basis", "source", "createdAt", "updatedAt"
      ) VALUES
        (
          '${R.normal}', '客户拜访-京A12345', '${U.zhangwei}', '${V.jingA}', 'REVIEW', 'NORMAL',
          150, 148, '2024-01-10T09:00:00Z', '2024-01-10T17:00:00Z',
          '2024-01-10T08:45:00Z', '2024-01-10T16:30:00Z', '客户拜访', '运营部',
          '${U.wangqiang}', NULL, NULL, NULL,
          '审核通过，里程使用合理，偏差在可接受范围内', '申请里程150km，实际里程148km，偏差率1.3%，客户签收单确认完整', 'OA系统申请', '2024-01-10T07:30:00Z', '2024-01-10T07:30:00Z'
        ),
        (
          '${R.ineligible}', '货物配送-京B67890', '${U.lina}', '${V.jingB}', 'PROCESSING', 'INELIGIBLE',
          300, 450, '2024-01-12T08:00:00Z', '2024-01-12T18:00:00Z',
          '2024-01-12T07:30:00Z', '2024-01-12T19:30:00Z', '货物配送', '运输部',
          '${U.wangqiang}', '申请人未取得货车驾驶资格证，实际驾驶人与登记不符', '1. 补办货运驾驶资格证; 2. 变更实际驾驶人并重新提交审批; 3. 提交临时驾驶授权申请', '${diffFields2}'::jsonb,
          NULL, NULL, '现场核查', '2024-01-12T06:30:00Z', '2024-01-12T06:30:00Z'
        ),
        (
          '${R.timeConflict}', '商务洽谈-京C11111', '${U.zhangwei}', '${V.jingC}', 'PROCESSING', 'TIME_CONFLICT',
          80, 80, '2024-01-15T09:00:00Z', '2024-01-15T17:00:00Z',
          '2024-01-15T08:30:00Z', '2024-01-15T18:30:00Z', '商务洽谈', '运营部',
          '${U.zhaomin}', '用车时间与京C11111已有调度记录冲突：2024-01-15 09:00-17:00已分配给销售部客户接待', '1. 调整用车时间为非冲突时段; 2. 申请更换可用车辆; 3. 协调冲突方调整行程', '${diffFields3}'::jsonb,
          NULL, NULL, '调度系统', '2024-01-14T15:00:00Z', '2024-01-14T15:00:00Z'
        ),
        (
          '${R.unconfirmed}', '园区巡查-京D22222', '${U.lina}', '${V.jingD}', 'RECEIVED', 'UNCONFIRMED',
          60, 60, '2024-01-20T09:00:00Z', '2024-01-20T12:00:00Z',
          NULL, NULL, '园区巡查', '运输部',
          '${U.lina}', '违章通知尚未确认：京D22222于2024-01-10存在未处理违章记录，需先完成违章确认方可继续', '1. 确认违章记录并完成处罚; 2. 提供违章已处理证明; 3. 申请特殊通行许可', NULL,
          NULL, NULL, '违章系统推送', '2024-01-20T07:30:00Z', '2024-01-20T07:30:00Z'
        )
    `);
    console.log('✅ 4条车辆使用记录插入完成');

    console.log('📝 插入流程节点数据...');
    await client.query(`
      INSERT INTO "ProcessingNode" ("id", "recordId", "nodeType", "operatorId", "action", "comment", "snapshot", "changedFields", "createdAt") VALUES
        ('${N.n1_created}',  '${R.normal}', 'CREATED',          '${U.zhangwei}', '提交用车申请', '申请使用京A12345进行客户拜访，预计里程150km',       '${snapshot1_created}'::jsonb,  NULL, '2024-01-10T07:30:00Z'),
        ('${N.n1_assigned}', '${R.normal}', 'ASSIGNED',         '${U.wangqiang}', '认领审核任务', '已分配至本人进行审核',                              '${snapshot1_assigned}'::jsonb, NULL, '2024-01-10T09:00:00Z'),
        ('${N.n1_process}',  '${R.normal}', 'PROCESSING',       '${U.wangqiang}', '审核处理中',   '核实车辆使用记录及里程数据',                         '${snapshot1_process}'::jsonb,  NULL, '2024-01-10T10:00:00Z'),
        ('${N.n1_review}',   '${R.normal}', 'REVIEW_SUBMITTED', '${U.wangqiang}', '提交审核意见', '审核通过，实际里程148km与申请里程150km基本一致',     '${snapshot1_review}'::jsonb,   NULL, '2024-01-10T16:00:00Z'),

        ('${N.n2_created}',  '${R.ineligible}', 'CREATED',    '${U.lina}',      '提交用车申请', '申请使用京B67890进行货物配送，预计里程300km',       '${snapshot2_created}'::jsonb,  NULL,                            '2024-01-12T06:30:00Z'),
        ('${N.n2_assigned}', '${R.ineligible}', 'ASSIGNED',   '${U.wangqiang}', '认领审核任务', '已分配至本人进行审核',                              '${snapshot2_assigned}'::jsonb, NULL,                            '2024-01-12T08:00:00Z'),
        ('${N.n2_process}',  '${R.ineligible}', 'PROCESSING', '${U.wangqiang}', '审核处理中',   '核查实际驾驶人与申请信息',                           '${snapshot2_process}'::jsonb,  NULL,                            '2024-01-12T09:00:00Z'),
        ('${N.n2_inelig}',   '${R.ineligible}', 'PROCESSING', '${U.wangqiang}', '标记资格不符', '发现实际驾驶人与登记不符，申请人未取得货车驾驶资格证', '${snapshot2_inelig}'::jsonb,   '${changedFields2}'::jsonb,     '2024-01-12T14:00:00Z'),

        ('${N.n3_created}',  '${R.timeConflict}', 'CREATED',    '${U.zhangwei}', '提交用车申请', '申请使用京C11111进行商务洽谈',                       '${snapshot3_created}'::jsonb,  NULL, '2024-01-14T15:00:00Z'),
        ('${N.n3_assigned}', '${R.timeConflict}', 'ASSIGNED',   '${U.zhaomin}',  '认领审核任务', '已分配至本人进行审核',                              '${snapshot3_assigned}'::jsonb, NULL, '2024-01-14T17:00:00Z'),
        ('${N.n3_process}',  '${R.timeConflict}', 'PROCESSING', '${U.zhaomin}',  '审核处理中',   '核查车辆调度时间',                                  '${snapshot3_process}'::jsonb,  NULL, '2024-01-15T08:00:00Z'),
        ('${N.n3_conflict}', '${R.timeConflict}', 'PROCESSING', '${U.zhaomin}',  '标记时间冲突', '发现用车时间与已有调度记录冲突',                      '${snapshot3_conflict}'::jsonb, NULL, '2024-01-15T10:00:00Z'),

        ('${N.n4_created}',  '${R.unconfirmed}', 'CREATED',  '${U.lina}', '提交用车申请', '申请使用京D22222进行园区巡查',   '${snapshot4_created}'::jsonb,  NULL, '2024-01-20T07:30:00Z'),
        ('${N.n4_assigned}', '${R.unconfirmed}', 'ASSIGNED', '${U.lina}', '认领审核任务', '分配至本人核实违章信息',          '${snapshot4_assigned}'::jsonb, NULL, '2024-01-20T09:00:00Z')
    `);
    console.log('✅ 14个流程节点插入完成');

    console.log('📊 插入业务记录数据...');
    await client.query(`
      INSERT INTO "BusinessRecord" ("id", "recordId", "content", "recordType", "createdById", "createdAt") VALUES
        ('${B.tripDesc}', '${R.normal}', '从公司总部出发，经三环到达客户公司，全程约148公里，客户已签收确认', '行程说明', '${U.zhangwei}', '2024-01-10T16:30:00Z')
    `);
    console.log('✅ 1条业务记录插入完成');

    console.log('📎 插入证据附件数据...');
    await client.query(`
      INSERT INTO "EvidenceAttachment" ("id", "recordId", "fileName", "fileType", "fileSize", "filePath", "description", "uploadedById", "createdAt") VALUES
        ('${E.signDoc}', '${R.normal}', '客户签收单.pdf', 'application/pdf', 1024000, '/uploads/evidence/客户签收单.pdf', '客户签收确认单据', '${U.wangqiang}', '2024-01-10T16:00:00Z')
    `);
    console.log('✅ 1个证据附件插入完成');

    console.log('⚠️ 插入违章信息数据...');
    await client.query(`
      INSERT INTO "ViolationInfo" ("id", "recordId", "violationType", "violationDate", "location", "fine", "penaltyPoints", "description", "isConfirmed") VALUES
        ('${VI.speeding}',    '${R.ineligible}', '超速', '2024-01-12T10:30:00Z', '京沪高速K125+300',    200, 3, '驾驶京B67890超速行驶，限速120km/h，实测156km/h', false),
        ('${VI.illegalPark}', '${R.unconfirmed}', '违停', '2024-01-10T14:00:00Z', '朝阳区建国路88号', 100, 0, '京D22222违章停车', false)
    `);
    console.log('✅ 2条违章信息插入完成');

    await client.query('COMMIT');
    console.log('🎉 种子数据插入完成！');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ 种子数据插入失败:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
