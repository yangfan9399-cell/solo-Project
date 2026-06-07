import { inspectOrder, getOrderPhotos } from '../../../db/mockData';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { passed, remark } = body;

  const photos = getOrderPhotos(id).filter(p => p.type === 'completion');

  if (!passed && photos.length === 0) {
    const result = inspectOrder(id, false, remark || '完成照片缺失，不予通过', 4, '赵质检');
    return {
      success: true,
      data: {
        order: result,
        photoMissing: true,
        message: '完成照片缺失，不能通过验收',
      },
    };
  }

  if (passed && photos.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '完成照片缺失，不能提交验收通过',
    });
  }

  const result = inspectOrder(id, passed, remark || '', 4, '赵质检');

  return {
    success: true,
    data: {
      order: result,
      photoMissing: photos.length === 0,
    },
  };
});
