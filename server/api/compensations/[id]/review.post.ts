import { reviewCompensation } from '../../../db/mockData';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { approved, remark } = body;

  if (typeof approved !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: '请选择审批结果',
    });
  }

  const result = reviewCompensation(id, approved, remark || '', 5, '刘主管');

  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: '赔付记录不存在',
    });
  }

  return {
    success: true,
    data: {
      compensation: result,
    },
  };
});
