import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

const dialect = new SqliteDialect({
  database: new Database('./data.db'),
});

const db = new Kysely({ dialect });

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000).toISOString();
}

const seedRecords = [
  {
    id: randomUUID(),
    card_no: 'MC20240001',
    holder_name: '张明',
    amount: 200.0,
    payment_channel: 'wechat',
    payment_transaction_no: 'WX202406010001',
    transaction_time: hoursAgo(48),
    exception_type: 'normal',
    credit_status: 'credited',
    credit_time: hoursAgo(47),
    refund_basis: null,
    refund_amount: null,
    refund_account: null,
    responsible_person: '李会计',
    status: 'pending',
    created_at: hoursAgo(48),
    updated_at: hoursAgo(48),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240002',
    holder_name: '王芳',
    amount: 500.0,
    payment_channel: 'alipay',
    payment_transaction_no: 'ALI202406010002',
    transaction_time: hoursAgo(36),
    exception_type: 'duplicate_deduction',
    credit_status: 'credited',
    credit_time: hoursAgo(35),
    refund_basis: '系统重复扣款，同一笔交易产生两条扣款记录',
    refund_amount: 500.0,
    refund_account: '王芳支付宝账户',
    responsible_person: '陈会计',
    status: 'pending',
    created_at: hoursAgo(36),
    updated_at: hoursAgo(36),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240003',
    holder_name: '刘强',
    amount: 300.0,
    payment_channel: 'bank_card',
    payment_transaction_no: 'BANK202406010003',
    transaction_time: hoursAgo(24),
    exception_type: 'paid_not_credited',
    credit_status: 'not_credited',
    credit_time: null,
    refund_basis: null,
    refund_amount: null,
    refund_account: null,
    responsible_person: '李会计',
    status: 'pending',
    created_at: hoursAgo(24),
    updated_at: hoursAgo(24),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240004',
    holder_name: '赵丽',
    amount: 150.0,
    payment_channel: 'wechat',
    payment_transaction_no: 'WX202406010004',
    transaction_time: hoursAgo(72),
    exception_type: 'refund_failed',
    credit_status: 'credited',
    credit_time: hoursAgo(71),
    refund_basis: '重复扣款发起退款，但退款通道异常导致退款失败',
    refund_amount: 150.0,
    refund_account: '赵丽微信账户',
    responsible_person: '陈会计',
    status: 'pending',
    created_at: hoursAgo(72),
    updated_at: hoursAgo(72),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240005',
    holder_name: '孙伟',
    amount: 1000.0,
    payment_channel: 'alipay',
    payment_transaction_no: 'ALI202406010005',
    transaction_time: hoursAgo(12),
    exception_type: 'duplicate_deduction',
    credit_status: 'credited',
    credit_time: hoursAgo(11),
    refund_basis: '支付宝重复扣款，确认第二笔为重复交易',
    refund_amount: 1000.0,
    refund_account: '孙伟支付宝账户',
    responsible_person: '李会计',
    status: 'refund_submitted',
    created_at: hoursAgo(12),
    updated_at: hoursAgo(6),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240006',
    holder_name: '周静',
    amount: 200.0,
    payment_channel: 'wechat',
    payment_transaction_no: 'WX202406010006',
    transaction_time: hoursAgo(8),
    exception_type: 'paid_not_credited',
    credit_status: 'not_credited',
    credit_time: null,
    refund_basis: null,
    refund_amount: null,
    refund_account: null,
    responsible_person: '陈会计',
    status: 'supplement_submitted',
    created_at: hoursAgo(8),
    updated_at: hoursAgo(4),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240007',
    holder_name: '吴刚',
    amount: 300.0,
    payment_channel: 'bank_card',
    payment_transaction_no: 'BANK202406010007',
    transaction_time: hoursAgo(96),
    exception_type: 'refund_failed',
    credit_status: 'credited',
    credit_time: hoursAgo(95),
    refund_basis: '银行卡退款通道故障，需重新发起退款',
    refund_amount: 300.0,
    refund_account: '吴刚工商银行账户',
    responsible_person: '李会计',
    status: 'reviewing',
    created_at: hoursAgo(96),
    updated_at: hoursAgo(2),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240008',
    holder_name: '郑丽',
    amount: 50.0,
    payment_channel: 'wechat',
    payment_transaction_no: 'WX202406010008',
    transaction_time: hoursAgo(168),
    exception_type: 'normal',
    credit_status: 'credited',
    credit_time: hoursAgo(167),
    refund_basis: null,
    refund_amount: null,
    refund_account: null,
    responsible_person: '陈会计',
    status: 'completed',
    created_at: hoursAgo(168),
    updated_at: hoursAgo(160),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240009',
    holder_name: '黄海',
    amount: 800.0,
    payment_channel: 'alipay',
    payment_transaction_no: 'ALI202406010009',
    transaction_time: hoursAgo(144),
    exception_type: 'duplicate_deduction',
    credit_status: 'credited',
    credit_time: hoursAgo(143),
    refund_basis: '系统异常导致重复扣款',
    refund_amount: 800.0,
    refund_account: '黄海支付宝账户',
    responsible_person: '李会计',
    status: 'completed',
    created_at: hoursAgo(144),
    updated_at: hoursAgo(120),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240010',
    holder_name: '林梅',
    amount: 400.0,
    payment_channel: 'bank_card',
    payment_transaction_no: 'BANK202406010010',
    transaction_time: hoursAgo(5),
    exception_type: 'paid_not_credited',
    credit_status: 'not_credited',
    credit_time: null,
    refund_basis: null,
    refund_amount: null,
    refund_account: null,
    responsible_person: '陈会计',
    status: 'pending',
    created_at: hoursAgo(5),
    updated_at: hoursAgo(5),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240011',
    holder_name: '何鹏',
    amount: 600.0,
    payment_channel: 'wechat',
    payment_transaction_no: 'WX202406010011',
    transaction_time: hoursAgo(3),
    exception_type: 'duplicate_deduction',
    credit_status: 'partially_credited',
    credit_time: hoursAgo(2),
    refund_basis: '微信支付重复扣款，第一笔已入账',
    refund_amount: 600.0,
    refund_account: '何鹏微信账户',
    responsible_person: '李会计',
    status: 'returned',
    created_at: hoursAgo(3),
    updated_at: hoursAgo(1),
  },
  {
    id: randomUUID(),
    card_no: 'MC20240012',
    holder_name: '马丽',
    amount: 250.0,
    payment_channel: 'alipay',
    payment_transaction_no: 'ALI202406010012',
    transaction_time: hoursAgo(192),
    exception_type: 'refund_failed',
    credit_status: 'credited',
    credit_time: hoursAgo(191),
    refund_basis: '支付宝退款接口超时，需重新发起',
    refund_amount: 250.0,
    refund_account: '马丽支付宝账户',
    responsible_person: '陈会计',
    status: 'completed',
    created_at: hoursAgo(192),
    updated_at: hoursAgo(150),
  },
];

async function initSchema() {
  await db.schema
    .createTable('exception_records')
    .ifNotExists()
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('card_no', 'varchar(20)', (col) => col.notNull())
    .addColumn('holder_name', 'varchar(50)', (col) => col.notNull())
    .addColumn('amount', 'real', (col) => col.notNull())
    .addColumn('payment_channel', 'varchar(20)', (col) => col.notNull())
    .addColumn('payment_transaction_no', 'varchar(64)', (col) => col.notNull())
    .addColumn('transaction_time', 'varchar(30)', (col) => col.notNull())
    .addColumn('exception_type', 'varchar(30)', (col) => col.notNull())
    .addColumn('credit_status', 'varchar(20)', (col) => col.notNull())
    .addColumn('credit_time', 'varchar(30)')
    .addColumn('refund_basis', 'text')
    .addColumn('refund_amount', 'real')
    .addColumn('refund_account', 'varchar(64)')
    .addColumn('responsible_person', 'varchar(50)', (col) => col.notNull())
    .addColumn('status', 'varchar(30)', (col) => col.notNull().defaultTo('pending'))
    .addColumn('created_at', 'varchar(30)', (col) => col.notNull())
    .addColumn('updated_at', 'varchar(30)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('processing_histories')
    .ifNotExists()
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('exception_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('operator', 'varchar(50)', (col) => col.notNull())
    .addColumn('operator_role', 'varchar(20)', (col) => col.notNull())
    .addColumn('action', 'varchar(40)', (col) => col.notNull())
    .addColumn('remark', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('created_at', 'varchar(30)', (col) => col.notNull())
    .execute();
}

async function seed() {
  await initSchema();

  for (const record of seedRecords) {
    await db.insertInto('exception_records').values(record).execute();
    await db
      .insertInto('processing_histories')
      .values({
        id: randomUUID(),
        exception_id: record.id,
        operator: record.responsible_person,
        operator_role: 'handler',
        action: 'created',
        remark: '系统自动创建异常记录',
        created_at: record.created_at,
      })
      .execute();

    if (record.status === 'refund_submitted') {
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: record.responsible_person,
          operator_role: 'handler',
          action: 'refund_submitted',
          remark: '提交退款申请，退款依据：' + record.refund_basis,
          created_at: hoursAgo(6),
        })
        .execute();
    }

    if (record.status === 'supplement_submitted') {
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: record.responsible_person,
          operator_role: 'handler',
          action: 'supplement_submitted',
          remark: '提交补记账申请，将充值金额直接入账到餐卡',
          created_at: hoursAgo(4),
        })
        .execute();
    }

    if (record.status === 'reviewing') {
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: record.responsible_person,
          operator_role: 'handler',
          action: 'refund_submitted',
          remark: '重新发起退款申请',
          created_at: hoursAgo(4),
        })
        .execute();
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: '赵审核',
          operator_role: 'reviewer',
          action: 'review_confirmed',
          remark: '复核中，等待最终确认',
          created_at: hoursAgo(2),
        })
        .execute();
    }

    if (record.status === 'returned') {
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: record.responsible_person,
          operator_role: 'handler',
          action: 'refund_submitted',
          remark: '提交退款申请',
          created_at: hoursAgo(2),
        })
        .execute();
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: '赵审核',
          operator_role: 'reviewer',
          action: 'returned_for_evidence',
          remark: '需要补充微信支付重复扣款的交易截图作为凭证',
          created_at: hoursAgo(1),
        })
        .execute();
    }

    if (record.status === 'completed') {
      if (record.exception_type === 'normal') {
        await db
          .insertInto('processing_histories')
          .values({
            id: randomUUID(),
            exception_id: record.id,
            operator: record.responsible_person,
            operator_role: 'handler',
            action: 'verified',
            remark: '核对确认，到账正常',
            created_at: hoursAgo(164),
          })
          .execute();
      } else {
        await db
          .insertInto('processing_histories')
          .values({
            id: randomUUID(),
            exception_id: record.id,
            operator: record.responsible_person,
            operator_role: 'handler',
            action: 'refund_submitted',
            remark: '提交退款申请',
            created_at: hoursAgo(140),
          })
          .execute();
        await db
          .insertInto('processing_histories')
          .values({
            id: randomUUID(),
            exception_id: record.id,
            operator: '赵审核',
            operator_role: 'reviewer',
            action: 'review_confirmed',
            remark: '复核确认，同意退款',
            created_at: hoursAgo(130),
          })
          .execute();
      }
      await db
        .insertInto('processing_histories')
        .values({
          id: randomUUID(),
          exception_id: record.id,
          operator: '系统',
          operator_role: 'handler',
          action: 'completed',
          remark: '处理完成',
          created_at: record.updated_at,
        })
        .execute();
    }
  }

  console.log('Seed data inserted successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
