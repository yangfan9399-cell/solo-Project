import db from './db/index.js'
import { initSchema } from './db/schema.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

async function seed() {
  await initSchema()

  await db.run('BEGIN TRANSACTION')

  try {
    await db.run('DELETE FROM follow_up_calls')
    await db.run('DELETE FROM adverse_reactions')
    await db.run('DELETE FROM revisit_reminders')
    await db.run('DELETE FROM vaccination_records')
    await db.run('DELETE FROM contraindications')
    await db.run('DELETE FROM checkins')
    await db.run('DELETE FROM appointments')
    await db.run('DELETE FROM vaccine_batches')
    await db.run('DELETE FROM vaccines')
    await db.run('DELETE FROM pets')
    await db.run('DELETE FROM owners')
    await db.run('DELETE FROM users')
    const now = new Date()
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const userIds = []
    let result = await db.run(
      'INSERT INTO users (username, name, role, phone) VALUES (?, ?, ?, ?)',
      ['admin', '张院长', 'director', '13800138000']
    )
    userIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO users (username, name, role, phone) VALUES (?, ?, ?, ?)',
      ['reception1', '李前台', 'receptionist', '13800138001']
    )
    userIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO users (username, name, role, phone) VALUES (?, ?, ?, ?)',
      ['reception2', '王前台', 'receptionist', '13800138002']
    )
    userIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO users (username, name, role, phone) VALUES (?, ?, ?, ?)',
      ['assistant1', '赵助理', 'assistant', '13800138003']
    )
    userIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO users (username, name, role, phone) VALUES (?, ?, ?, ?)',
      ['assistant2', '陈助理', 'assistant', '13800138004']
    )
    userIds.push(result.lastID)

    const ownerIds = []
    result = await db.run(
      'INSERT INTO owners (name, phone, id_card, address, notes) VALUES (?, ?, ?, ?, ?)',
      ['刘先生', '13900139001', '110101199001011234', '北京市朝阳区建国路88号', '老客户，养有多只宠物']
    )
    ownerIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO owners (name, phone, id_card, address, notes) VALUES (?, ?, ?, ?, ?)',
      ['周女士', '13900139002', '110102199202022345', '北京市海淀区中关村大街1号', '新客户，首次来院']
    )
    ownerIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO owners (name, phone, id_card, address, notes) VALUES (?, ?, ?, ?, ?)',
      ['吴先生', '13900139003', '110103198803033456', '北京市西城区金融街1号', '宠物有过敏史']
    )
    ownerIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO owners (name, phone, id_card, address, notes) VALUES (?, ?, ?, ?, ?)',
      ['郑女士', '13900139004', '110104199104044567', '北京市东城区王府井大街1号', '需要提前电话确认']
    )
    ownerIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO owners (name, phone, id_card, address, notes) VALUES (?, ?, ?, ?, ?)',
      ['孙先生', '13900139005', '110105198505055678', '北京市丰台区南三环西路1号', '周末方便预约']
    )
    ownerIds.push(result.lastID)

    const petIds = []
    result = await db.run(
      'INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerIds[0], '豆豆', 'dog', '金毛寻回犬', 'male', '2021-03-15', 28.5, '金黄色', '900000123456789', 1, '性格温顺，定期体检']
    )
    petIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerIds[0], '咪咪', 'cat', '英国短毛猫', 'female', '2022-06-20', 4.2, '蓝灰色', '900000123456790', 1, '胆子小，需要安静环境']
    )
    petIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerIds[1], '旺财', 'dog', '柯基', 'male', '2023-01-10', 12.3, '三色', '900000123456791', 0, '活泼好动']
    )
    petIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerIds[2], '雪球', 'cat', '布偶猫', 'female', '2022-09-01', 5.1, '海豹双色', '900000123456792', 0, '对青霉素过敏，有心脏病史']
    )
    petIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerIds[3], '小黑', 'dog', '拉布拉多', 'male', '2020-11-25', 32.0, '黑色', '900000123456793', 1, '导盲犬，需要特别照顾']
    )
    petIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerIds[4], '花花', 'cat', '中华田园猫', 'female', '2023-04-18', 3.5, '橘白', '', 0, '流浪猫收养，首次接种疫苗']
    )
    petIds.push(result.lastID)

    const vaccineIds = []
    result = await db.run(
      'INSERT INTO vaccines (name, manufacturer, type, dose_volume, applicable_species, interval_days, booster_doses, storage_condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['犬四联疫苗', '硕腾', 'core', 1.0, 'dog', 21, 3, '2-8°C冷藏', '预防犬瘟热、犬细小病毒病、犬副流感、犬腺病毒病']
    )
    vaccineIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccines (name, manufacturer, type, dose_volume, applicable_species, interval_days, booster_doses, storage_condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['犬狂犬疫苗', '默沙东', 'rabies', 1.0, 'dog', 365, 0, '2-8°C冷藏', '灭活狂犬疫苗，每年加强']
    )
    vaccineIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccines (name, manufacturer, type, dose_volume, applicable_species, interval_days, booster_doses, storage_condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['猫三联疫苗', '硕腾', 'core', 1.0, 'cat', 21, 2, '2-8°C冷藏', '预防猫瘟热、猫鼻气管炎、猫杯状病毒病']
    )
    vaccineIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccines (name, manufacturer, type, dose_volume, applicable_species, interval_days, booster_doses, storage_condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['猫狂犬疫苗', '默沙东', 'rabies', 1.0, 'cat', 365, 0, '2-8°C冷藏', '灭活狂犬疫苗，每年加强']
    )
    vaccineIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccines (name, manufacturer, type, dose_volume, applicable_species, interval_days, booster_doses, storage_condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['犬八联疫苗', '维克', 'core', 1.0, 'dog', 21, 3, '2-8°C冷藏', '预防8种犬类传染病']
    )
    vaccineIds.push(result.lastID)

    const batchIds = []
    result = await db.run(
      'INSERT INTO vaccine_batches (vaccine_id, batch_no, manufacture_date, expiry_date, quantity, used_quantity, unit_price, supplier, lot_number, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaccineIds[0], 'B202403001', '2024-03-15', '2025-03-14', 100, 25, 80.0, '北京兽药经销公司', 'LOT20240315A', 'normal', '常规批次']
    )
    batchIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccine_batches (vaccine_id, batch_no, manufacture_date, expiry_date, quantity, used_quantity, unit_price, supplier, lot_number, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaccineIds[0], 'B202403002', '2024-03-20', '2025-03-19', 50, 5, 80.0, '北京兽药经销公司', 'LOT20240320A', 'normal', '']
    )
    batchIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccine_batches (vaccine_id, batch_no, manufacture_date, expiry_date, quantity, used_quantity, unit_price, supplier, lot_number, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaccineIds[1], 'R202402001', '2024-02-10', nextYear.toISOString().slice(0, 10), 200, 45, 60.0, '上海生物制药', 'RAB20240210', 'normal', '政府采购批次']
    )
    batchIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccine_batches (vaccine_id, batch_no, manufacture_date, expiry_date, quantity, used_quantity, unit_price, supplier, lot_number, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaccineIds[2], 'C202401001', '2024-01-25', '2025-01-24', 80, 30, 90.0, '北京兽药经销公司', 'LOT20240125C', 'normal', '']
    )
    batchIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccine_batches (vaccine_id, batch_no, manufacture_date, expiry_date, quantity, used_quantity, unit_price, supplier, lot_number, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaccineIds[3], 'R202402002', '2024-02-15', nextYear.toISOString().slice(0, 10), 150, 20, 60.0, '上海生物制药', 'RAB20240215', 'normal', '']
    )
    batchIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO vaccine_batches (vaccine_id, batch_no, manufacture_date, expiry_date, quantity, used_quantity, unit_price, supplier, lot_number, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaccineIds[4], 'E202404001', '2024-04-01', '2025-03-31', 30, 2, 150.0, '维克中国', 'VIC20240401', 'expired', '已过期批次，请勿使用']
    )
    batchIds.push(result.lastID)

    const apptIds = []
    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[0], ownerIds[0], yesterday.toISOString().slice(0, 10), '09:00-09:30', vaccineIds[0], 'vaccination', 'completed', yesterday.toISOString().slice(0, 10) + ' 09:05:00', yesterday.toISOString().slice(0, 10) + ' 09:45:00', userIds[3], '常规年度加强免疫']
    )
    apptIds.push(result.lastID)

    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[2], ownerIds[1], today.toISOString().slice(0, 10), '10:00-10:30', vaccineIds[0], 'vaccination', 'scheduled', null, null, userIds[4], '幼犬首免第三针']
    )
    apptIds.push(result.lastID)

    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[3], ownerIds[2], today.toISOString().slice(0, 10), '14:00-14:30', vaccineIds[2], 'vaccination', 'checked_in', today.toISOString().slice(0, 10) + ' 13:55:00', null, userIds[3], '猫咪年度加强，注意过敏史']
    )
    apptIds.push(result.lastID)

    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[1], ownerIds[0], tomorrow.toISOString().slice(0, 10), '09:30-10:00', vaccineIds[2], 'vaccination', 'scheduled', null, null, userIds[4], '']
    )
    apptIds.push(result.lastID)

    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[4], ownerIds[3], tomorrow.toISOString().slice(0, 10), '15:00-15:30', vaccineIds[1], 'vaccination', 'scheduled', null, null, userIds[3], '狂犬疫苗年度加强']
    )
    apptIds.push(result.lastID)

    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[5], ownerIds[4], nextWeek.toISOString().slice(0, 10), '11:00-11:30', vaccineIds[2], 'vaccination', 'scheduled', null, null, userIds[4], '流浪猫首次免疫']
    )
    apptIds.push(result.lastID)

    result = await db.run(
      'INSERT INTO appointments (pet_id, owner_id, appointment_date, time_slot, vaccine_id, appointment_type, status, checkin_time, checkout_time, assigned_user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[0], ownerIds[0], nextWeek.toISOString().slice(0, 10), '14:30-15:00', null, 'recheck', 'scheduled', null, null, userIds[3], '复诊检查上次接种后情况']
    )
    apptIds.push(result.lastID)

    const checkinIds = []
    result = await db.run(
      'INSERT INTO checkins (appointment_id, pet_id, owner_id, checkin_time, temperature, weight, heart_rate, respiratory_rate, general_condition, checked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [apptIds[0], petIds[0], ownerIds[0], yesterday.toISOString().slice(0, 10) + ' 09:05:00', 38.5, 28.5, 95, 22, '良好', userIds[3]]
    )
    checkinIds.push(result.lastID)
    result = await db.run(
      'INSERT INTO checkins (appointment_id, pet_id, owner_id, checkin_time, temperature, weight, heart_rate, respiratory_rate, general_condition, checked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [apptIds[2], petIds[3], ownerIds[2], today.toISOString().slice(0, 10) + ' 13:55:00', 38.8, 5.1, 130, 28, '精神尚可', userIds[3]]
    )
    checkinIds.push(result.lastID)

    await db.run(
      'INSERT INTO contraindications (pet_id, checkin_id, type, description, severity, onset_date, resolved, noted_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[3], checkinIds[1], 'allergy', '青霉素过敏，注射后出现皮疹', 'moderate', '2023-06-15', 1, userIds[3], '用药前需确认无青霉素成分']
    )
    await db.run(
      'INSERT INTO contraindications (pet_id, checkin_id, type, description, severity, onset_date, resolved, noted_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [petIds[3], null, 'other', '先天性心脏病，需避免应激', 'severe', '2022-10-01', 0, userIds[3], '就诊时需特别注意，备好急救药品']
    )

    const vacRecordIds = []
    const vacDate = yesterday.toISOString().slice(0, 10)
    const nextDue = new Date(yesterday)
    nextDue.setDate(nextDue.getDate() + 365)
    result = await db.run(
      'INSERT INTO vaccination_records (appointment_id, checkin_id, pet_id, vaccine_batch_id, vaccine_id, administration_date, administration_site, dose_volume, given_by, next_due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [apptIds[0], checkinIds[0], petIds[0], batchIds[0], vaccineIds[0], vacDate, '颈部皮下', 1.0, userIds[3], nextDue.toISOString().slice(0, 10), '接种顺利，无异常']
    )
    vacRecordIds.push(result.lastID)

    const remDate = new Date(yesterday)
    remDate.setDate(remDate.getDate() + 7)
    await db.run(
      'INSERT INTO revisit_reminders (pet_id, vaccination_record_id, reminder_date, reminder_type, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [petIds[0], vacRecordIds[0], remDate.toISOString().slice(0, 10), 'booster', 'pending', '接种后一周回访']
    )
    await db.run(
      'INSERT INTO revisit_reminders (pet_id, vaccination_record_id, reminder_date, reminder_type, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [petIds[0], vacRecordIds[0], nextDue.toISOString().slice(0, 10), 'booster', 'pending', '下次疫苗接种提醒']
    )

    const reactionDate = new Date(yesterday)
    reactionDate.setHours(reactionDate.getHours() + 2)
    await db.run(
      'INSERT INTO adverse_reactions (vaccination_record_id, pet_id, reaction_type, severity, onset_time, symptoms, treatment_provided, follow_up_required, reported_by, resolved, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vacRecordIds[0], petIds[0], '注射部位肿胀', 'mild', reactionDate.toISOString(), '注射部位轻微肿胀，直径约2cm，无发热', '局部冷敷，建议观察', 1, userIds[4], 1, '24小时后自行消退，主人已电话确认']
    )

    const callDate = new Date(today)
    callDate.setHours(10, 0, 0)
    await db.run(
      'INSERT INTO follow_up_calls (adverse_reaction_id, pet_id, call_type, call_date, caller_id, call_result, response_details, follow_up_action, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [1, petIds[0], 'adverse_reaction', callDate.toISOString(), userIds[4], 'connected', '主人反馈肿胀已消退，宠物精神食欲正常', '无需进一步处理', '已记录回访结果']
    )
    await db.run(
      'INSERT INTO follow_up_calls (adverse_reaction_id, pet_id, call_type, call_date, caller_id, call_result, response_details, follow_up_action, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [null, petIds[1], 'revisit_reminder', callDate.toISOString(), userIds[1], 'connected', '主人确认明日按时赴约', '无需进一步处理', '已发送短信提醒']
    )

    await db.run('COMMIT')
    console.log('Database seeded successfully!')
  } catch (error) {
    await db.run('ROLLBACK')
    console.error('Error seeding database:', error)
    throw error
  }
}

seed().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
