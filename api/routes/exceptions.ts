import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { queryExceptions, getExceptionById, getHistoriesByExceptionId, updateException, insertHistory, isInited } from '../../shared/db.js';
import { seedData } from '../../shared/seed.js';
import type { ExceptionType, PaymentChannel, RecordStatus } from '../../shared/types.js';

const router = Router();

function ensureSeeded() {
  if (!isInited()) seedData();
}

router.get('/', (req: Request, res: Response) => {
  ensureSeeded();

  const type = req.query.type as ExceptionType | undefined;
  const channel = req.query.channel as PaymentChannel | undefined;
  const status = req.query.status as RecordStatus | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 20);

  const allRecords = queryExceptions({
    type: type || undefined,
    channel: channel || undefined,
    status: status || undefined,
  });

  const total = allRecords.length;
  const start = (page - 1) * limit;
  const data = allRecords.slice(start, start + limit);

  res.json({ data, total });
});

router.get('/:id', (req: Request, res: Response) => {
  ensureSeeded();

  const { id } = req.params;
  const record = getExceptionById(id);
  if (!record) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const histories = getHistoriesByExceptionId(id);
  res.json({ ...record, histories });
});

router.post('/:id/verify', (req: Request, res: Response) => {
  ensureSeeded();

  const { id } = req.params;
  const record = getExceptionById(id);
  if (!record) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { operator } = req.body;
  const now = new Date().toISOString();

  updateException(id, { status: 'completed', updated_at: now });

  insertHistory({
    id: randomUUID(),
    exception_id: id,
    operator: operator || '经办人',
    operator_role: 'handler',
    action: 'verified',
    remark: '核对确认，到账正常',
    created_at: now,
  });

  const updated = getExceptionById(id);
  res.json(updated);
});

router.post('/:id/refund', (req: Request, res: Response) => {
  ensureSeeded();

  const { id } = req.params;
  const record = getExceptionById(id);
  if (!record) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { operator, basis, amount, account } = req.body;
  const now = new Date().toISOString();

  updateException(id, {
    status: 'refund_submitted',
    refund_basis: basis,
    refund_amount: amount,
    refund_account: account,
    updated_at: now,
  });

  insertHistory({
    id: randomUUID(),
    exception_id: id,
    operator: operator || '经办人',
    operator_role: 'handler',
    action: 'refund_submitted',
    remark: `提交退款申请，退款依据：${basis}，退款金额：${amount}，退款账户：${account}`,
    created_at: now,
  });

  const updated = getExceptionById(id);
  res.json(updated);
});

router.post('/:id/supplement', (req: Request, res: Response) => {
  ensureSeeded();

  const { id } = req.params;
  const record = getExceptionById(id);
  if (!record) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { operator, remark } = req.body;
  const now = new Date().toISOString();

  updateException(id, {
    status: 'supplement_submitted',
    updated_at: now,
  });

  insertHistory({
    id: randomUUID(),
    exception_id: id,
    operator: operator || '经办人',
    operator_role: 'handler',
    action: 'supplement_submitted',
    remark: remark || '提交补记账申请，将充值金额直接入账到餐卡',
    created_at: now,
  });

  const updated = getExceptionById(id);
  res.json(updated);
});

router.post('/:id/review', (req: Request, res: Response) => {
  ensureSeeded();

  const { id } = req.params;
  const record = getExceptionById(id);
  if (!record) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { operator, action, remark } = req.body;
  const now = new Date().toISOString();

  if (action === 'confirm') {
    updateException(id, { status: 'completed', updated_at: now });

    insertHistory({
      id: randomUUID(),
      exception_id: id,
      operator: operator || '复核人',
      operator_role: 'reviewer',
      action: 'review_confirmed',
      remark: remark || '复核确认，同意处理结果',
      created_at: now,
    });

    insertHistory({
      id: randomUUID(),
      exception_id: id,
      operator: '系统',
      operator_role: 'handler',
      action: 'completed',
      remark: '处理完成',
      created_at: now,
    });
  } else if (action === 'return') {
    updateException(id, { status: 'returned', updated_at: now });

    insertHistory({
      id: randomUUID(),
      exception_id: id,
      operator: operator || '复核人',
      operator_role: 'reviewer',
      action: 'returned_for_evidence',
      remark: remark || '退回，要求补充证据',
      created_at: now,
    });
  } else {
    res.status(400).json({ error: 'Invalid action. Use "confirm" or "return".' });
    return;
  }

  const updated = getExceptionById(id);
  res.json(updated);
});

export default router;
