import { execute, queryOne, transaction } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const record = queryOne('SELECT status, tool_id, tool_code FROM calibration_records WHERE id = ?', [id])
  if (!record) {
    throw createError({
      statusCode: 404,
      message: '校准记录不存在'
    })
  }

  if ((record as any).status === 'passed') {
    throw createError({
      statusCode: 400,
      message: '该校准记录已完成，无法重复操作'
    })
  }

  if ((record as any).status === 'failed') {
    throw createError({
      statusCode: 400,
      message: '该校准记录已标记为不合格，无法重复操作'
    })
  }

  if ((record as any).status !== 'in_progress' && (record as any).status !== 'scheduled') {
    throw createError({
      statusCode: 400,
      message: '只有计划中或进行中的校准可以完成'
    })
  }

  if (body.passed === undefined) {
    throw createError({
      statusCode: 400,
      message: '请指定校准结果'
    })
  }

  if (!body.actualDate) {
    throw createError({
      statusCode: 400,
      message: '请填写实际校准日期'
    })
  }

  transaction(() => {
    execute(`
      UPDATE calibration_records SET
        status = ?,
        actual_date = ?,
        certificate_number = ?,
        calibration_result = ?,
        next_calibration_date = ?,
        cost = ?,
        remark = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      body.passed ? 'passed' : 'failed',
      body.actualDate,
      body.certificateNumber || '',
      body.result || '',
      body.nextCalibrationDate || null,
      body.cost || 0,
      body.remark || '',
      id
    ])

    if (body.passed) {
      execute(`
        UPDATE tools SET
          last_calibration_date = ?,
          next_calibration_date = ?,
          status = CASE WHEN status = 'calibrating' THEN 'available' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [body.actualDate, body.nextCalibrationDate || null, (record as any).tool_id])
    } else {
      execute(`
        UPDATE tools SET
          status = 'maintenance',
          remark = COALESCE(remark, '') || ? ,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [`\n校准不合格需维护: ${body.result || '未说明原因'}\n处理时间: ${new Date().toISOString()}`, (record as any).tool_id])
    }
  })

  return { success: true }
})
