import { createCompensation } from '../../../db/mockData';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { amount, reason, ruleType } = body;

  if (!amount || !reason || !ruleType) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整的赔付信息',
    });
  }

  const result = createCompensation(id, amount, reason, ruleType, 4, '赵质检');

  return {
    success: true,
    data: {
      compensation: result,
    },
  };
});
