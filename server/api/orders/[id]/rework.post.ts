import { createRework, getOrderRework } from '../../../db/mockData';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { reason, description, deadlineHours, cleanerId } = body;

  if (!reason || !description || !deadlineHours || !cleanerId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整的返工信息',
    });
  }

  const result = createRework(id, reason, description, deadlineHours, cleanerId, 4, '赵质检');

  return {
    success: true,
    data: {
      rework: result,
    },
  };
});
