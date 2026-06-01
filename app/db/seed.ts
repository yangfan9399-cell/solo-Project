import { db } from "./index";

console.log("Seeding database with sample data...");

const users = [
  { name: "张明", role: "藏品管理员", email: "zhangming@museum.com", phone: "13800138001", department: "藏品部" },
  { name: "李华", role: "策展人", email: "lihua@museum.com", phone: "13800138002", department: "策展部" },
  { name: "王强", role: "文保专家", email: "wangqiang@museum.com", phone: "13800138003", department: "文保部" },
  { name: "赵军", role: "安保运输负责人", email: "zhaojun@museum.com", phone: "13800138004", department: "安保部" },
  { name: "陈静", role: "管理员", email: "chenjing@museum.com", phone: "13800138005", department: "综合部" },
];

const exhibits = [
  {
    name: "青铜方鼎",
    code: "EX-001",
    category: "青铜器",
    era: "商代晚期",
    material: "青铜",
    dimensions: "高45cm，口径32cm",
    weight: "约25kg",
    description: "商代晚期青铜重器，铸造精美，纹饰华丽，具有重要的历史价值。",
    condition: "完好",
    storage_location: "A区-3号柜",
    value: "一级文物",
    insurance_info: "保额500万元",
    image_url: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400",
  },
  {
    name: "青花缠枝莲纹瓶",
    code: "EX-002",
    category: "瓷器",
    era: "明永乐年间",
    material: "瓷器",
    dimensions: "高52cm，口径14cm",
    weight: "约5kg",
    description: "明代永乐官窑精品，青花发色纯正，纹饰流畅。",
    condition: "完好",
    storage_location: "B区-2号柜",
    value: "一级文物",
    insurance_info: "保额800万元",
    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  },
  {
    name: "《山水图》立轴",
    code: "EX-003",
    category: "书画",
    era: "清代",
    material: "绢本设色",
    dimensions: "纵180cm，横85cm",
    weight: "约1kg",
    description: "清代著名画家作品，笔墨精湛，意境深远。",
    condition: "良好，有轻微黄斑",
    storage_location: "C区-恒温恒湿柜",
    value: "二级文物",
    insurance_info: "保额300万元",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400",
  },
  {
    name: "玉璧",
    code: "EX-004",
    category: "玉器",
    era: "汉代",
    material: "和田玉",
    dimensions: "直径18cm，孔径5cm",
    weight: "约800g",
    description: "汉代玉璧，玉质温润，雕工精细。",
    condition: "完好",
    storage_location: "A区-5号柜",
    value: "一级文物",
    insurance_info: "保额600万元",
    image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400",
  },
  {
    name: "唐三彩骆驼",
    code: "EX-005",
    category: "陶器",
    era: "唐代",
    material: "三彩陶",
    dimensions: "高68cm，长55cm",
    weight: "约15kg",
    description: "唐代三彩精品，造型生动，釉色鲜艳。",
    condition: "完好",
    storage_location: "B区-7号柜",
    value: "一级文物",
    insurance_info: "保额450万元",
    image_url: "https://images.unsplash.com/photo-1584038138504-45967ab1f8fc?w=400",
  },
];

const loanApplications = [
  {
    exhibit_id: 1,
    exhibit_name: "青铜方鼎",
    applicant_id: 2,
    applicant_name: "李华",
    borrowing_institution: "国家博物馆",
    contact_person: "刘馆长",
    contact_phone: "13900139001",
    contact_email: "liuguan@nationalmuseum.gov.cn",
    exhibition_name: "中华文明五千年特展",
    exhibition_location: "国家博物馆北展厅",
    purpose: "配合国家博物馆中华文明主题展览，展示商代青铜文明成就",
    start_date: "2024-07-01",
    end_date: "2024-10-15",
    status: "approved",
    current_stage: "exhibition",
    priority: "high",
  },
  {
    exhibit_id: 2,
    exhibit_name: "青花缠枝莲纹瓶",
    applicant_id: 2,
    applicant_name: "李华",
    borrowing_institution: "上海博物馆",
    contact_person: "王主任",
    contact_phone: "13900139002",
    contact_email: "wangzhuren@shanghaimuseum.org",
    exhibition_name: "明代官窑瓷器精品展",
    exhibition_location: "上海博物馆陶瓷馆",
    purpose: "参与明代官窑瓷器专题展览",
    start_date: "2024-08-15",
    end_date: "2024-11-30",
    status: "approved",
    current_stage: "transport",
    priority: "normal",
  },
  {
    exhibit_id: 3,
    exhibit_name: "《山水图》立轴",
    applicant_id: 2,
    applicant_name: "李华",
    borrowing_institution: "南京博物院",
    contact_person: "陈研究员",
    contact_phone: "13900139003",
    contact_email: "chenyanjiu@njmuseum.com",
    exhibition_name: "清代山水画名家作品展",
    exhibition_location: "南京博物院书画厅",
    purpose: "清代山水画专题展览",
    start_date: "2024-09-01",
    end_date: "2024-12-15",
    status: "pending",
    current_stage: "review",
    priority: "normal",
  },
  {
    exhibit_id: 4,
    exhibit_name: "玉璧",
    applicant_id: 2,
    applicant_name: "李华",
    borrowing_institution: "陕西历史博物馆",
    contact_person: "张馆长",
    contact_phone: "13900139004",
    contact_email: "zhangguan@sxmuseum.cn",
    exhibition_name: "丝路遗珍-古代玉器特展",
    exhibition_location: "陕西历史博物馆",
    purpose: "丝绸之路主题展览",
    start_date: "2024-10-01",
    end_date: "2025-01-15",
    status: "pending",
    current_stage: "application",
    priority: "low",
  },
];

const conservationReviews = [
  {
    loan_id: 1,
    reviewer_id: 3,
    reviewer_name: "王强",
    temperature_requirement: "18-22℃",
    humidity_requirement: "45-55% RH",
    light_requirement: "≤150 lux",
    packaging_requirement: "定制锦盒，内部软包，防震缓冲材料",
    special_requirements: "运输过程中保持竖直放置，避免震动",
    condition_assessment: "展品整体状态良好，纹饰清晰，无明显病害",
    risks: "长途运输震动风险，温湿度变化风险",
    recommendations: "建议使用专业文物运输车辆，配备温湿度监控设备",
    approved: 1,
    review_date: "2024-06-15 10:30:00",
    remarks: "符合借展文保要求",
  },
  {
    loan_id: 2,
    reviewer_id: 3,
    reviewer_name: "王强",
    temperature_requirement: "18-24℃",
    humidity_requirement: "50-60% RH",
    light_requirement: "≤200 lux",
    packaging_requirement: "定制泡沫内衬，外置木箱，缓冲材料填充",
    special_requirements: "轻拿轻放，避免碰撞",
    condition_assessment: "器形完整，釉色完好",
    risks: "瓷器易碎，运输风险较高",
    recommendations: "建议购买额外运输保险，安排专人押运",
    approved: 1,
    review_date: "2024-07-20 14:00:00",
    remarks: "同意借展，需严格执行包装要求",
  },
];

const transportRecords = [
  {
    loan_id: 1,
    transport_type: "专业文物运输",
    carrier: "文博物流有限公司",
    vehicle_number: "京A·88888",
    driver_name: "刘师傅",
    driver_phone: "13700137001",
    departure_location: "本馆文物库房",
    destination: "国家博物馆北展厅",
    scheduled_departure: "2024-06-28 08:00:00",
    scheduled_arrival: "2024-06-28 12:00:00",
    actual_departure: "2024-06-28 08:30:00",
    actual_arrival: "2024-06-28 11:45:00",
    escort_name: "张明",
    escort_phone: "13800138001",
    security_measures: "全程GPS定位，实时视频监控，安保人员随行",
    status: "completed",
    remarks: "运输顺利，展品完好",
  },
  {
    loan_id: 2,
    transport_type: "专业文物运输",
    carrier: "文博物流有限公司",
    vehicle_number: "沪B·66666",
    driver_name: "王师傅",
    driver_phone: "13700137002",
    departure_location: "本馆文物库房",
    destination: "上海博物馆陶瓷馆",
    scheduled_departure: "2024-08-10 09:00:00",
    scheduled_arrival: "2024-08-11 18:00:00",
    actual_departure: "2024-08-10 09:15:00",
    actual_arrival: null,
    escort_name: "赵军",
    escort_phone: "13800138004",
    security_measures: "全程GPS定位，温湿度记录仪，双人押运",
    status: "in_transit",
    remarks: "运输中",
  },
];

const inspectionRecords = [
  {
    loan_id: 1,
    inspector_id: 1,
    inspector_name: "张明",
    inspection_date: "2024-07-05 10:00:00",
    temperature: "20℃",
    humidity: "50% RH",
    condition_status: "完好",
    display_check: "展柜密封良好，标签正确",
    security_check: "安防系统正常，24小时监控",
    environment_check: "温湿度稳定，光照符合要求",
    findings: "展品状态良好，无异常",
    recommendations: "继续保持日常巡检频率",
    photos: null,
  },
  {
    loan_id: 1,
    inspector_id: 1,
    inspector_name: "张明",
    inspection_date: "2024-07-15 10:30:00",
    temperature: "21℃",
    humidity: "48% RH",
    condition_status: "完好",
    display_check: "展柜正常",
    security_check: "监控正常",
    environment_check: "环境稳定",
    findings: "一切正常",
    recommendations: "无",
    photos: null,
  },
];

const exceptions = [
  {
    loan_id: 2,
    exhibit_id: 2,
    reporter_id: 4,
    reporter_name: "赵军",
    type: "transport",
    title: "运输途中遭遇堵车",
    description: "在京沪高速遭遇严重堵车，预计到达时间延迟约2小时",
    severity: "low",
    status: "resolved",
    assigned_to_id: 4,
    assigned_to_name: "赵军",
    resolution: "已联系接收方调整接货时间，展品安全无虞",
    resolved_at: "2024-08-10 16:00:00",
  },
  {
    loan_id: 1,
    exhibit_id: 1,
    reporter_id: 1,
    reporter_name: "张明",
    type: "exhibition",
    title: "展厅温度略高",
    description: "展厅温度达到23℃，略高于要求的22℃上限",
    severity: "medium",
    status: "open",
    assigned_to_id: 3,
    assigned_to_name: "王强",
    resolution: null,
    resolved_at: null,
  },
];

try {
  const insertUser = db.prepare(
    "INSERT INTO users (name, role, email, phone, department) VALUES (?, ?, ?, ?, ?)"
  );
  users.forEach((user) => {
    insertUser.run(user.name, user.role, user.email, user.phone, user.department);
  });
  console.log(`Inserted ${users.length} users`);

  const insertExhibit = db.prepare(
    `INSERT INTO exhibits (name, code, category, era, material, dimensions, weight, description, condition, storage_location, value, insurance_info, image_url) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  exhibits.forEach((exhibit) => {
    insertExhibit.run(
      exhibit.name,
      exhibit.code,
      exhibit.category,
      exhibit.era,
      exhibit.material,
      exhibit.dimensions,
      exhibit.weight,
      exhibit.description,
      exhibit.condition,
      exhibit.storage_location,
      exhibit.value,
      exhibit.insurance_info,
      exhibit.image_url
    );
  });
  console.log(`Inserted ${exhibits.length} exhibits`);

  const insertLoan = db.prepare(
    `INSERT INTO loan_applications (exhibit_id, exhibit_name, applicant_id, applicant_name, borrowing_institution, contact_person, contact_phone, contact_email, exhibition_name, exhibition_location, purpose, start_date, end_date, status, current_stage, priority) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  loanApplications.forEach((loan) => {
    insertLoan.run(
      loan.exhibit_id,
      loan.exhibit_name,
      loan.applicant_id,
      loan.applicant_name,
      loan.borrowing_institution,
      loan.contact_person,
      loan.contact_phone,
      loan.contact_email,
      loan.exhibition_name,
      loan.exhibition_location,
      loan.purpose,
      loan.start_date,
      loan.end_date,
      loan.status,
      loan.current_stage,
      loan.priority
    );
  });
  console.log(`Inserted ${loanApplications.length} loan applications`);

  const insertReview = db.prepare(
    `INSERT INTO conservation_reviews (loan_id, reviewer_id, reviewer_name, temperature_requirement, humidity_requirement, light_requirement, packaging_requirement, special_requirements, condition_assessment, risks, recommendations, approved, review_date, remarks) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  conservationReviews.forEach((review) => {
    insertReview.run(
      review.loan_id,
      review.reviewer_id,
      review.reviewer_name,
      review.temperature_requirement,
      review.humidity_requirement,
      review.light_requirement,
      review.packaging_requirement,
      review.special_requirements,
      review.condition_assessment,
      review.risks,
      review.recommendations,
      review.approved,
      review.review_date,
      review.remarks
    );
  });
  console.log(`Inserted ${conservationReviews.length} conservation reviews`);

  const insertTransport = db.prepare(
    `INSERT INTO transport_records (loan_id, transport_type, carrier, vehicle_number, driver_name, driver_phone, departure_location, destination, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival, escort_name, escort_phone, security_measures, status, remarks) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  transportRecords.forEach((transport) => {
    insertTransport.run(
      transport.loan_id,
      transport.transport_type,
      transport.carrier,
      transport.vehicle_number,
      transport.driver_name,
      transport.driver_phone,
      transport.departure_location,
      transport.destination,
      transport.scheduled_departure,
      transport.scheduled_arrival,
      transport.actual_departure,
      transport.actual_arrival,
      transport.escort_name,
      transport.escort_phone,
      transport.security_measures,
      transport.status,
      transport.remarks
    );
  });
  console.log(`Inserted ${transportRecords.length} transport records`);

  const insertInspection = db.prepare(
    `INSERT INTO inspection_records (loan_id, inspector_id, inspector_name, inspection_date, temperature, humidity, condition_status, display_check, security_check, environment_check, findings, recommendations, photos) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  inspectionRecords.forEach((inspection) => {
    insertInspection.run(
      inspection.loan_id,
      inspection.inspector_id,
      inspection.inspector_name,
      inspection.inspection_date,
      inspection.temperature,
      inspection.humidity,
      inspection.condition_status,
      inspection.display_check,
      inspection.security_check,
      inspection.environment_check,
      inspection.findings,
      inspection.recommendations,
      inspection.photos
    );
  });
  console.log(`Inserted ${inspectionRecords.length} inspection records`);

  const insertException = db.prepare(
    `INSERT INTO exceptions (loan_id, exhibit_id, reporter_id, reporter_name, type, title, description, severity, status, assigned_to_id, assigned_to_name, resolution, resolved_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  exceptions.forEach((exception) => {
    insertException.run(
      exception.loan_id,
      exception.exhibit_id,
      exception.reporter_id,
      exception.reporter_name,
      exception.type,
      exception.title,
      exception.description,
      exception.severity,
      exception.status,
      exception.assigned_to_id,
      exception.assigned_to_name,
      exception.resolution,
      exception.resolved_at
    );
  });
  console.log(`Inserted ${exceptions.length} exceptions`);

  console.log("Database seeding completed successfully!");
} catch (error) {
  console.error("Error seeding database:", error);
  process.exit(1);
}
