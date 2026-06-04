import type { APIRoute } from 'astro';
import { getAllExceptions, seedData, isInited } from '../../../lib/db';
import type { AggregateStats } from '../../../lib/types';
import { EXCEPTION_TYPE_LABELS, PAYMENT_CHANNEL_LABELS } from '../../../lib/types';

export const GET: APIRoute = async () => {
  if (!isInited()) seedData();

  const allRecords = getAllExceptions();

  const byExceptionType = Object.entries(EXCEPTION_TYPE_LABELS).map(([type, label]) => {
    const records = allRecords.filter((r) => r.exception_type === type);
    return {
      type: label,
      count: records.length,
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    };
  });

  const byPaymentChannel = Object.entries(PAYMENT_CHANNEL_LABELS).map(([channel, label]) => {
    const records = allRecords.filter((r) => r.payment_channel === channel);
    return {
      channel: label,
      count: records.length,
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
    };
  });

  const processingTime = Object.entries(EXCEPTION_TYPE_LABELS).map(([type, label]) => {
    const records = allRecords.filter((r) => r.exception_type === type && r.status === 'completed');
    if (records.length === 0) {
      return { type: label, avgHours: 0, maxHours: 0, minHours: 0 };
    }
    const hours = records.map((r) => {
      const start = new Date(r.created_at).getTime();
      const end = new Date(r.updated_at).getTime();
      return (end - start) / 3600000;
    });
    return {
      type: label,
      avgHours: Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10,
      maxHours: Math.round(Math.max(...hours) * 10) / 10,
      minHours: Math.round(Math.min(...hours) * 10) / 10,
    };
  });

  const completedRecords = allRecords.filter((r) => r.status === 'completed');
  const refundFailedRecords = allRecords.filter((r) => r.exception_type === 'refund_failed');
  const refundInProgress = allRecords.filter(
    (r) =>
      (r.exception_type === 'duplicate_deduction' || r.exception_type === 'refund_failed') &&
      ['refund_submitted', 'reviewing'].includes(r.status)
  );

  const refundResult = [
    {
      result: '退款成功',
      count: completedRecords.filter(
        (r) => r.exception_type === 'duplicate_deduction' || r.exception_type === 'refund_failed'
      ).length,
      totalAmount: completedRecords
        .filter((r) => r.exception_type === 'duplicate_deduction' || r.exception_type === 'refund_failed')
        .reduce((sum, r) => sum + (r.refund_amount || 0), 0),
    },
    {
      result: '退款失败',
      count: refundFailedRecords.filter((r) => r.status !== 'completed').length,
      totalAmount: refundFailedRecords
        .filter((r) => r.status !== 'completed')
        .reduce((sum, r) => sum + (r.refund_amount || 0), 0),
    },
    {
      result: '退款中',
      count: refundInProgress.length,
      totalAmount: refundInProgress.reduce((sum, r) => sum + (r.refund_amount || 0), 0),
    },
  ];

  const stats: AggregateStats = { byExceptionType, byPaymentChannel, processingTime, refundResult };

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json' },
  });
};
