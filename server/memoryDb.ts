import { TopicStatus, ReviewResult, ScheduleConflictType, UserRole } from "@prisma/client";

let db: any = {
  users: [] as any[],
  categories: [] as any[],
  topics: [] as any[],
  reviews: [] as any[],
  schedules: [] as any[],
  scheduleConflicts: [] as any[],
  revisionRecords: [] as any[],
  archiveLogs: [] as any[],
  statusHistories: [] as any[],
};

let idCounter = 0;
function genId(prefix: string = "id"): string {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function initSeedData() {
  idCounter = 0;

  const users = [
    { id: "user-1", name: "张编辑", email: "zhang@example.com", role: UserRole.EDITOR, avatar: null },
    { id: "user-2", name: "李编辑", email: "li@example.com", role: UserRole.EDITOR, avatar: null },
    { id: "user-3", name: "刘主编", email: "liu@example.com", role: UserRole.CHIEF_EDITOR, avatar: null },
    { id: "user-4", name: "王排期", email: "wang@example.com", role: UserRole.SCHEDULER, avatar: null },
    { id: "user-5", name: "陈复核", email: "chen@example.com", role: UserRole.REVIEWER, avatar: null },
  ];

  const categories = [
    { id: "cat-1", name: "科技", description: "科技资讯与深度报道" },
    { id: "cat-2", name: "财经", description: "财经新闻与市场分析" },
    { id: "cat-3", name: "文化", description: "文化艺术与娱乐" },
    { id: "cat-4", name: "体育", description: "体育赛事与运动" },
  ];

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const topics = [
    {
      id: "topic-1",
      title: "人工智能大模型技术突破：新一代多模态模型发布",
      originalTitle: null,
      summary: "某科技公司发布新一代多模态大模型，在多项基准测试中刷新全球记录，展现了强大的推理能力和多模态理解能力。",
      source: "科技媒体",
      sourceUrl: "https://example.com/ai-model",
      copyrightEvidence: "已获得官方授权，授权书编号：AUTH-2026-001",
      contentOutline: "# 引言\n## 技术背景\n## 核心突破\n### 多模态能力\n### 推理能力\n## 应用场景\n## 总结",
      priority: 1,
      status: TopicStatus.PUBLISHED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(5).toISOString(),
      updatedAt: daysAgo(2).toISOString(),
      scheduledAt: daysAgo(2).toISOString(),
      publishedAt: daysAgo(2).toISOString(),
      archivedAt: null,
      categoryId: "cat-1",
      submitterId: "user-1",
      currentHandlerId: "user-5",
    },
    {
      id: "topic-2",
      title: "全球股市震荡，投资者避险情绪升温",
      originalTitle: null,
      summary: "受多重因素影响，全球股市出现震荡，投资者避险情绪明显升温。分析师建议关注防御性板块。",
      source: "财经通讯社",
      sourceUrl: "https://example.com/stock-market",
      copyrightEvidence: "转载许可协议编号：REP-2026-042",
      contentOutline: "# 市场概况\n## 震荡原因分析\n## 板块表现\n## 投资建议\n## 后市展望",
      priority: 1,
      status: TopicStatus.APPROVED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(3).toISOString(),
      updatedAt: daysAgo(2).toISOString(),
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-2",
      submitterId: "user-2",
      currentHandlerId: "user-4",
    },
    {
      id: "topic-3",
      title: "知名导演新作上映首日票房破亿",
      originalTitle: null,
      summary: "知名导演最新力作上映首日票房突破亿元大关，口碑票房双丰收。",
      source: "娱乐媒体",
      sourceUrl: "https://example.com/movie",
      copyrightEvidence: null,
      contentOutline: "# 影片介绍\n## 导演与主演\n## 剧情简介\n## 票房表现\n## 口碑评价",
      priority: 2,
      status: TopicStatus.COPYRIGHT_MISSING,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(2).toISOString(),
      updatedAt: daysAgo(1).toISOString(),
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-3",
      submitterId: "user-1",
      currentHandlerId: "user-1",
    },
    {
      id: "topic-4",
      title: "欧冠决赛前瞻：两支豪门球队对决",
      originalTitle: "欧冠决赛展望",
      summary: "欧冠决赛即将打响，两支豪门球队将展开巅峰对决，谁能捧起冠军奖杯？",
      source: "体育媒体",
      sourceUrl: "https://example.com/champions-league",
      copyrightEvidence: "赛事官方合作媒体授权",
      contentOutline: "# 决赛对阵\n## 球队分析\n## 关键球员\n## 历史交锋\n## 比赛前瞻",
      priority: 1,
      status: TopicStatus.TITLE_REVISION,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(2).toISOString(),
      updatedAt: daysAgo(1).toISOString(),
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-4",
      submitterId: "user-2",
      currentHandlerId: "user-2",
    },
    {
      id: "topic-5",
      title: "新能源汽车销量持续增长，市场竞争加剧",
      originalTitle: null,
      summary: "新能源汽车市场持续火热，销量持续增长，各大车企加速布局。",
      source: "行业报告",
      sourceUrl: "https://example.com/ev-report",
      copyrightEvidence: "行业协会数据授权",
      contentOutline: "# 市场概况\n## 销量数据\n## 竞争格局\n## 技术趋势\n## 未来展望",
      priority: 1,
      status: TopicStatus.SCHEDULED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(4).toISOString(),
      updatedAt: daysAgo(1).toISOString(),
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-1",
      submitterId: "user-1",
      currentHandlerId: "user-5",
    },
    {
      id: "topic-6",
      title: "智能手机市场报告发布，国产品牌表现亮眼",
      originalTitle: null,
      summary: "最新智能手机市场报告发布，国产品牌市场份额持续提升，创新能力不断增强。",
      source: "市场研究机构",
      sourceUrl: "https://example.com/smartphone-report",
      copyrightEvidence: "报告机构合作授权",
      contentOutline: "# 整体市场\n## 品牌排名\n## 国产品牌分析\n## 技术创新\n## 趋势预测",
      priority: 2,
      status: TopicStatus.SCHEDULED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 1,
      createdAt: daysAgo(4).toISOString(),
      updatedAt: daysAgo(1).toISOString(),
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-1",
      submitterId: "user-2",
      currentHandlerId: "user-5",
    },
    {
      id: "topic-7",
      title: "楼市调控政策解读",
      originalTitle: null,
      summary: "最新楼市调控政策出台，对市场产生深远影响，专家深度解读。",
      source: "政策文件",
      sourceUrl: "https://example.com/real-estate-policy",
      copyrightEvidence: "官方公开信息",
      contentOutline: "# 政策要点\n## 出台背景\n## 市场影响\n## 专家解读\n## 购房者建议",
      priority: 1,
      status: TopicStatus.PENDING_REVIEW,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(1).toISOString(),
      updatedAt: daysAgo(1).toISOString(),
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-2",
      submitterId: "user-1",
      currentHandlerId: "user-3",
    },
    {
      id: "topic-8",
      title: "马拉松赛事热情高涨，跑者故事感人",
      originalTitle: null,
      summary: "城市马拉松赛事热情高涨，跑者们的故事让人感动，展现了运动精神。",
      source: "现场采访",
      sourceUrl: null,
      copyrightEvidence: "原创内容，采访记录完整",
      contentOutline: "# 赛事概况\n## 跑者故事\n### 故事一\n### 故事二\n## 赛事花絮\n## 结语",
      priority: 3,
      status: TopicStatus.ARCHIVED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(14).toISOString(),
      updatedAt: daysAgo(7).toISOString(),
      scheduledAt: daysAgo(10).toISOString(),
      publishedAt: daysAgo(10).toISOString(),
      archivedAt: daysAgo(7).toISOString(),
      categoryId: "cat-4",
      submitterId: "user-2",
      currentHandlerId: "user-5",
    },
    {
      id: "topic-9",
      title: "年度经济数据发布",
      originalTitle: null,
      summary: "国家统计局发布最新经济数据，多项指标超预期。",
      source: "官方发布",
      sourceUrl: "https://example.com/economic-data",
      copyrightEvidence: "官方公开数据",
      contentOutline: "# 总体情况\n## GDP数据\n## 主要指标\n## 行业分析\n## 经济展望",
      priority: 1,
      status: TopicStatus.PUBLISHED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: daysAgo(8).toISOString(),
      updatedAt: daysAgo(4).toISOString(),
      scheduledAt: daysAgo(4).toISOString(),
      publishedAt: daysAgo(4).toISOString(),
      archivedAt: null,
      categoryId: "cat-2",
      submitterId: "user-1",
      currentHandlerId: "user-5",
    },
    {
      id: "topic-10",
      title: "电竞赛事报道",
      originalTitle: null,
      summary: "顶级电竞赛事火热进行中，精彩对决不断上演。",
      source: "游戏媒体",
      sourceUrl: "https://example.com/esports",
      copyrightEvidence: null,
      contentOutline: "# 赛事介绍\n## 对阵情况\n## 选手风采\n## 精彩回顾",
      priority: 3,
      status: TopicStatus.REJECTED,
      rejectCount: 1,
      rejectReason: "内容不符合栏目定位，与体育栏目调性不符",
      delayCount: 0,
      createdAt: daysAgo(6).toISOString(),
      updatedAt: daysAgo(5).toISOString(),
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-4",
      submitterId: "user-2",
      currentHandlerId: "user-3",
    },
    {
      id: "topic-11",
      title: "5G应用场景拓展，工业互联网加速落地",
      originalTitle: null,
      summary: "5G技术应用场景不断拓展，工业互联网加速落地实施，赋能传统产业转型升级。",
      source: "行业观察",
      sourceUrl: "https://example.com/5g-industry",
      copyrightEvidence: "行业白皮书引用授权",
      contentOutline: "# 5G发展现状\n## 工业互联网概述\n## 应用场景\n### 智能制造\n### 智慧矿山\n## 挑战与机遇",
      priority: 2,
      status: TopicStatus.SCHEDULED,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 2,
      createdAt: daysAgo(7).toISOString(),
      updatedAt: daysAgo(1).toISOString(),
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-1",
      submitterId: "user-1",
      currentHandlerId: "user-5",
    },
    {
      id: "topic-12",
      title: "传统文化复兴：传统技艺传承人专访",
      originalTitle: null,
      summary: "传统文化复兴浪潮下，传统技艺传承人讲述他们的坚守与创新。",
      source: "独家专访",
      sourceUrl: null,
      copyrightEvidence: "原创内容，专访授权书齐全",
      contentOutline: "# 引言\n## 技艺传承\n## 坚守与创新\n## 传承人心声\n## 结语",
      priority: 3,
      status: TopicStatus.DRAFT,
      rejectCount: 0,
      rejectReason: null,
      delayCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledAt: null,
      publishedAt: null,
      archivedAt: null,
      categoryId: "cat-3",
      submitterId: "user-2",
      currentHandlerId: "user-2",
    },
  ];

  const reviews = [
    {
      id: "review-1",
      topicId: "topic-1",
      reviewerId: "user-3",
      result: ReviewResult.APPROVED,
      comment: "选题价值高，来源可靠，同意发布。",
      createdAt: daysAgo(4).toISOString(),
    },
    {
      id: "review-2",
      topicId: "topic-2",
      reviewerId: "user-3",
      result: ReviewResult.APPROVED,
      comment: "内容详实，数据准确，审核通过。",
      createdAt: daysAgo(2).toISOString(),
    },
    {
      id: "review-3",
      topicId: "topic-3",
      reviewerId: "user-3",
      result: ReviewResult.COPYRIGHT_MISSING,
      comment: "请补充版权证明材料，剧照和采访授权都需要提供。",
      createdAt: daysAgo(1).toISOString(),
    },
    {
      id: "review-4",
      topicId: "topic-4",
      reviewerId: "user-3",
      result: ReviewResult.TITLE_REVISION,
      comment: "标题太平淡，建议修改得更有吸引力，突出决赛看点。",
      createdAt: daysAgo(1).toISOString(),
    },
    {
      id: "review-5",
      topicId: "topic-5",
      reviewerId: "user-3",
      result: ReviewResult.APPROVED,
      comment: "数据翔实，分析到位，同意发布。",
      createdAt: daysAgo(3).toISOString(),
    },
    {
      id: "review-6",
      topicId: "topic-6",
      reviewerId: "user-3",
      result: ReviewResult.APPROVED,
      comment: "报告质量不错，通过审核。",
      createdAt: daysAgo(3).toISOString(),
    },
    {
      id: "review-7",
      topicId: "topic-8",
      reviewerId: "user-3",
      result: ReviewResult.APPROVED,
      comment: "故事感人，角度新颖，同意发布。",
      createdAt: daysAgo(12).toISOString(),
    },
    {
      id: "review-8",
      topicId: "topic-10",
      reviewerId: "user-3",
      result: ReviewResult.REJECTED,
      comment: "电竞内容与体育栏目调性不符，建议转到科技或文化栏目，或者直接放弃。",
      createdAt: daysAgo(5).toISOString(),
    },
  ];

  const schedules = [
    {
      id: "schedule-1",
      topicId: "topic-1",
      schedulerId: "user-4",
      scheduledAt: daysAgo(2).toISOString(),
      timeSlot: "MORNING",
      note: "科技头条，早间发布",
      isPrimary: true,
      createdAt: daysAgo(3).toISOString(),
    },
    {
      id: "schedule-2",
      topicId: "topic-5",
      schedulerId: "user-4",
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timeSlot: "MORNING",
      note: "新能源专题",
      isPrimary: true,
      createdAt: daysAgo(1).toISOString(),
    },
    {
      id: "schedule-3",
      topicId: "topic-6",
      schedulerId: "user-4",
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timeSlot: "MORNING",
      note: "手机市场报告，与新能源同天但不同栏目",
      isPrimary: true,
      createdAt: daysAgo(1).toISOString(),
    },
    {
      id: "schedule-4",
      topicId: "topic-8",
      schedulerId: "user-4",
      scheduledAt: daysAgo(10).toISOString(),
      timeSlot: "NOON",
      note: "午间阅读",
      isPrimary: true,
      createdAt: daysAgo(11).toISOString(),
    },
    {
      id: "schedule-5",
      topicId: "topic-9",
      schedulerId: "user-4",
      scheduledAt: daysAgo(4).toISOString(),
      timeSlot: "MORNING",
      note: "重大数据发布，早间头条",
      isPrimary: true,
      createdAt: daysAgo(5).toISOString(),
    },
    {
      id: "schedule-6",
      topicId: "topic-11",
      schedulerId: "user-4",
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      timeSlot: "EVENING",
      note: "深度报道，晚间发布",
      isPrimary: true,
      createdAt: daysAgo(1).toISOString(),
    },
  ];

  const scheduleConflicts = [
    {
      id: "conflict-1",
      topicId: "topic-5",
      conflictingTopicId: "topic-6",
      conflictType: ScheduleConflictType.SAME_CATEGORY,
      description: "同栏目（科技）选题同一天发布",
      resolved: true,
      createdAt: daysAgo(1).toISOString(),
    },
  ];

  const revisionRecords = [
    {
      id: "revision-1",
      topicId: "topic-4",
      editorId: "user-2",
      fieldName: "title",
      oldValue: "欧冠决赛展望",
      newValue: "欧冠决赛前瞻：两支豪门球队对决",
      reason: "标题不够吸引人，根据主编审核意见修改",
      createdAt: daysAgo(1).toISOString(),
    },
    {
      id: "revision-2",
      topicId: "topic-6",
      editorId: "user-2",
      fieldName: "title",
      oldValue: "手机市场报告",
      newValue: "智能手机市场报告发布，国产品牌表现亮眼",
      reason: "优化标题，突出核心亮点",
      createdAt: daysAgo(2).toISOString(),
    },
  ];

  const archiveLogs = [
    {
      id: "archive-1",
      topicId: "topic-1",
      reviewerId: "user-5",
      action: "PUBLISH",
      comment: "按时发布",
      createdAt: daysAgo(2).toISOString(),
    },
    {
      id: "archive-2",
      topicId: "topic-8",
      reviewerId: "user-5",
      action: "PUBLISH",
      comment: "按时发布",
      createdAt: daysAgo(10).toISOString(),
    },
    {
      id: "archive-3",
      topicId: "topic-8",
      reviewerId: "user-5",
      action: "ARCHIVE",
      comment: "发布一周后归档",
      createdAt: daysAgo(7).toISOString(),
    },
    {
      id: "archive-4",
      topicId: "topic-9",
      reviewerId: "user-5",
      action: "PUBLISH",
      comment: "按时发布",
      createdAt: daysAgo(4).toISOString(),
    },
  ];

  const statusHistories = [
    { id: "sh-1-1", topicId: "topic-1", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-1", createdAt: daysAgo(5).toISOString() },
    { id: "sh-1-2", topicId: "topic-1", status: TopicStatus.PENDING_REVIEW, remark: "提交审核", operatorId: "user-1", createdAt: daysAgo(4).toISOString() },
    { id: "sh-1-3", topicId: "topic-1", status: TopicStatus.APPROVED, remark: "审核通过", operatorId: "user-3", createdAt: daysAgo(4).toISOString() },
    { id: "sh-1-4", topicId: "topic-1", status: TopicStatus.SCHEDULED, remark: "排期：发布日", operatorId: "user-4", createdAt: daysAgo(3).toISOString() },
    { id: "sh-1-5", topicId: "topic-1", status: TopicStatus.PUBLISHED, remark: "已发布", operatorId: "user-5", createdAt: daysAgo(2).toISOString() },
    { id: "sh-2-1", topicId: "topic-2", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-2", createdAt: daysAgo(3).toISOString() },
    { id: "sh-2-2", topicId: "topic-2", status: TopicStatus.PENDING_REVIEW, remark: "提交审核", operatorId: "user-2", createdAt: daysAgo(3).toISOString() },
    { id: "sh-2-3", topicId: "topic-2", status: TopicStatus.APPROVED, remark: "审核通过", operatorId: "user-3", createdAt: daysAgo(2).toISOString() },
    { id: "sh-3-1", topicId: "topic-3", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-1", createdAt: daysAgo(2).toISOString() },
    { id: "sh-3-2", topicId: "topic-3", status: TopicStatus.PENDING_REVIEW, remark: "提交审核", operatorId: "user-1", createdAt: daysAgo(2).toISOString() },
    { id: "sh-3-3", topicId: "topic-3", status: TopicStatus.COPYRIGHT_MISSING, remark: "版权材料缺失，请补充", operatorId: "user-3", createdAt: daysAgo(1).toISOString() },
    { id: "sh-4-1", topicId: "topic-4", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-2", createdAt: daysAgo(2).toISOString() },
    { id: "sh-4-2", topicId: "topic-4", status: TopicStatus.PENDING_REVIEW, remark: "提交审核", operatorId: "user-2", createdAt: daysAgo(2).toISOString() },
    { id: "sh-4-3", topicId: "topic-4", status: TopicStatus.TITLE_REVISION, remark: "标题需修改", operatorId: "user-3", createdAt: daysAgo(1).toISOString() },
    { id: "sh-7-1", topicId: "topic-7", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-1", createdAt: daysAgo(1).toISOString() },
    { id: "sh-7-2", topicId: "topic-7", status: TopicStatus.PENDING_REVIEW, remark: "提交审核", operatorId: "user-1", createdAt: daysAgo(1).toISOString() },
    { id: "sh-10-1", topicId: "topic-10", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-2", createdAt: daysAgo(6).toISOString() },
    { id: "sh-10-2", topicId: "topic-10", status: TopicStatus.PENDING_REVIEW, remark: "提交审核", operatorId: "user-2", createdAt: daysAgo(6).toISOString() },
    { id: "sh-10-3", topicId: "topic-10", status: TopicStatus.REJECTED, remark: "内容不符合栏目定位", operatorId: "user-3", createdAt: daysAgo(5).toISOString() },
    { id: "sh-12-1", topicId: "topic-12", status: TopicStatus.DRAFT, remark: "创建草稿", operatorId: "user-2", createdAt: new Date().toISOString() },
  ];

  db = {
    users,
    categories,
    topics,
    reviews,
    schedules,
    scheduleConflicts,
    revisionRecords,
    archiveLogs,
    statusHistories,
  };
}

initSeedData();

function findUser(where: any) {
  if (where.id) {
    return db.users.find((u: any) => u.id === where.id);
  }
  return null;
}

function findManyUsers(args: any = {}) {
  let result = [...db.users];
  if (args.where?.role) {
    result = result.filter((u: any) => u.role === args.where.role);
  }
  if (args.orderBy) {
    const key = Object.keys(args.orderBy)[0];
    const dir = args.orderBy[key];
    result.sort((a: any, b: any) => {
      if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
      if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }
  if (args.select) {
    const keys = Object.keys(args.select);
    result = result.map((u: any) => {
      const obj: any = {};
      keys.forEach((k) => {
        if (args.select[k]) obj[k] = u[k];
      });
      return obj;
    });
  }
  return result;
}

function findManyCategories(args: any = {}) {
  let result = [...db.categories];
  if (args.orderBy) {
    const key = Object.keys(args.orderBy)[0];
    const dir = args.orderBy[key];
    result.sort((a: any, b: any) => {
      if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
      if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }
  if (args.include?._count?.select?.topics) {
    result = result.map((c: any) => ({
      ...c,
      _count: { topics: db.topics.filter((t: any) => t.categoryId === c.id).length },
    }));
  }
  return result;
}

function findManyTopics(args: any = {}) {
  let result = [...db.topics];
  const where = args.where || {};

  if (where.status) {
    result = result.filter((t: any) => t.status === where.status);
  }
  if (where.categoryId) {
    result = result.filter((t: any) => t.categoryId === where.categoryId);
  }
  if (where.submitterId) {
    result = result.filter((t: any) => t.submitterId === where.submitterId);
  }
  if (where.OR) {
    result = result.filter((t: any) =>
      where.OR.some((cond: any) => {
        if (cond.title?.contains) {
          return t.title.toLowerCase().includes(cond.title.contains.toLowerCase());
        }
        if (cond.summary?.contains) {
          return t.summary.toLowerCase().includes(cond.summary.contains.toLowerCase());
        }
        return false;
      })
    );
  }
  if (where.status?.in) {
    result = result.filter((t: any) => where.status.in.includes(t.status));
  }
  if (where.id?.not) {
    result = result.filter((t: any) => t.id !== where.id.not);
  }
  if (where.scheduledAt) {
    if (where.scheduledAt.gte) {
      result = result.filter((t: any) => t.scheduledAt && new Date(t.scheduledAt) >= new Date(where.scheduledAt.gte));
    }
    if (where.scheduledAt.lte) {
      result = result.filter((t: any) => t.scheduledAt && new Date(t.scheduledAt) <= new Date(where.scheduledAt.lte));
    }
  }

  if (args.orderBy) {
    const key = Object.keys(args.orderBy)[0];
    const dir = args.orderBy[key];
    result.sort((a: any, b: any) => {
      if (a[key] === null) return 1;
      if (b[key] === null) return -1;
      if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
      if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  if (args.skip !== undefined && args.take !== undefined) {
    result = result.slice(args.skip, args.skip + args.take);
  }

  if (args.include) {
    result = result.map((t: any) => {
      const obj = { ...t };
      if (args.include.category) {
        obj.category = db.categories.find((c: any) => c.id === t.categoryId) || null;
      }
      if (args.include.submitter) {
        const submitter = db.users.find((u: any) => u.id === t.submitterId);
        if (args.include.submitter.select) {
          const keys = Object.keys(args.include.submitter.select);
          obj.submitter = {};
          keys.forEach((k) => {
            if (args.include.submitter.select[k]) {
              obj.submitter[k] = submitter?.[k];
            }
          });
        } else {
          obj.submitter = submitter || null;
        }
      }
      if (args.include.schedules) {
        let schedules = db.schedules.filter((s: any) => s.topicId === t.id);
        if (args.include.schedules.orderBy) {
          const key = Object.keys(args.include.schedules.orderBy)[0];
          const dir = args.include.schedules.orderBy[key];
          schedules.sort((a: any, b: any) => {
            if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
            if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
            return 0;
          });
        }
        if (args.include.schedules.take) {
          schedules = schedules.slice(0, args.include.schedules.take);
        }
        obj.schedules = schedules;
      }
      return obj;
    });
  }

  return result;
}

function countTopics(where: any = {}) {
  return findManyTopics({ where }).length;
}

function findUniqueTopic(where: any, include: any = {}) {
  const topic = db.topics.find((t: any) => t.id === where.id);
  if (!topic) return null;

  const result = { ...topic };

  if (include.category) {
    result.category = db.categories.find((c: any) => c.id === topic.categoryId) || null;
  }
  if (include.submitter) {
    const submitter = db.users.find((u: any) => u.id === topic.submitterId);
    result.submitter = submitter || null;
  }
  if (include.currentHandler) {
    const handler = db.users.find((u: any) => u.id === topic.currentHandlerId);
    result.currentHandler = handler || null;
  }
  if (include.reviews) {
    let reviews = db.reviews.filter((r: any) => r.topicId === topic.id);
    if (include.reviews.include?.reviewer) {
      reviews = reviews.map((r: any) => ({
        ...r,
        reviewer: db.users.find((u: any) => u.id === r.reviewerId) || null,
      }));
    }
    if (include.reviews.orderBy) {
      const key = Object.keys(include.reviews.orderBy)[0];
      const dir = include.reviews.orderBy[key];
      reviews.sort((a: any, b: any) => {
        if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
        if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    result.reviews = reviews;
  }
  if (include.schedules) {
    let schedules = db.schedules.filter((s: any) => s.topicId === topic.id);
    if (include.schedules.include?.scheduler) {
      schedules = schedules.map((s: any) => ({
        ...s,
        scheduler: db.users.find((u: any) => u.id === s.schedulerId) || null,
      }));
    }
    if (include.schedules.orderBy) {
      const key = Object.keys(include.schedules.orderBy)[0];
      const dir = include.schedules.orderBy[key];
      schedules.sort((a: any, b: any) => {
        if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
        if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    if (include.schedules.take) {
      schedules = schedules.slice(0, include.schedules.take);
    }
    result.schedules = schedules;
  }
  if (include.revisionRecords) {
    let revisions = db.revisionRecords.filter((r: any) => r.topicId === topic.id);
    if (include.revisionRecords.include?.editor) {
      revisions = revisions.map((r: any) => ({
        ...r,
        editor: db.users.find((u: any) => u.id === r.editorId) || null,
      }));
    }
    if (include.revisionRecords.orderBy) {
      const key = Object.keys(include.revisionRecords.orderBy)[0];
      const dir = include.revisionRecords.orderBy[key];
      revisions.sort((a: any, b: any) => {
        if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
        if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    result.revisionRecords = revisions;
  }
  if (include.archiveLogs) {
    let logs = db.archiveLogs.filter((l: any) => l.topicId === topic.id);
    if (include.archiveLogs.include?.reviewer) {
      logs = logs.map((l: any) => ({
        ...l,
        reviewer: db.users.find((u: any) => u.id === l.reviewerId) || null,
      }));
    }
    if (include.archiveLogs.orderBy) {
      const key = Object.keys(include.archiveLogs.orderBy)[0];
      const dir = include.archiveLogs.orderBy[key];
      logs.sort((a: any, b: any) => {
        if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
        if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    if (include.archiveLogs.take) {
      logs = logs.slice(0, include.archiveLogs.take);
    }
    result.archiveLogs = logs;
  }
  if (include.statusHistory) {
    let history = db.statusHistories.filter((h: any) => h.topicId === topic.id);
    if (include.statusHistory.include?.operator) {
      history = history.map((h: any) => ({
        ...h,
        operator: db.users.find((u: any) => u.id === h.operatorId) || null,
      }));
    }
    if (include.statusHistory.orderBy) {
      const key = Object.keys(include.statusHistory.orderBy)[0];
      const dir = include.statusHistory.orderBy[key];
      history.sort((a: any, b: any) => {
        if (a[key] < b[key]) return dir === "asc" ? -1 : 1;
        if (a[key] > b[key]) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    result.statusHistory = history;
  }
  if (include.conflictDetectedConflicts) {
    let conflicts = db.scheduleConflicts.filter((c: any) => c.topicId === topic.id);
    if (include.conflictDetectedConflicts.where?.resolved === false) {
      conflicts = conflicts.filter((c: any) => !c.resolved);
    }
    if (include.conflictDetectedConflicts.include?.conflictingTopic) {
      conflicts = conflicts.map((c: any) => ({
        ...c,
        conflictingTopic: db.topics.find((t: any) => t.id === c.conflictingTopicId) || null,
      }));
    }
    result.conflictDetectedConflicts = conflicts;
  }

  return result;
}

function createTopic(data: any) {
  const topic = {
    id: genId("topic"),
    title: data.title,
    originalTitle: data.originalTitle || null,
    summary: data.summary,
    source: data.source,
    sourceUrl: data.sourceUrl || null,
    copyrightEvidence: data.copyrightEvidence || null,
    contentOutline: data.contentOutline || null,
    priority: data.priority || 2,
    status: data.status || TopicStatus.DRAFT,
    rejectCount: 0,
    rejectReason: null,
    delayCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduledAt: null,
    publishedAt: null,
    archivedAt: null,
    categoryId: data.categoryId || null,
    submitterId: data.submitterId,
    currentHandlerId: data.currentHandlerId || data.submitterId,
  };

  db.topics.push(topic);

  if (data.statusHistory?.create) {
    const sh = {
      id: genId("sh"),
      topicId: topic.id,
      status: data.status || TopicStatus.DRAFT,
      operatorId: data.statusHistory.create.operatorId,
      remark: data.statusHistory.create.remark,
      createdAt: new Date().toISOString(),
    };
    db.statusHistories.push(sh);
  }

  return findUniqueTopic({ id: topic.id }, { category: true, submitter: { select: { id: true, name: true, role: true } } });
}

function updateTopic(where: any, data: any) {
  const index = db.topics.findIndex((t: any) => t.id === where.id);
  if (index === -1) return null;

  const existing = db.topics[index];
  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };

  if (data.title && data.title !== existing.title) {
    updated.originalTitle = existing.originalTitle || existing.title;
  }

  if (data.rejectCount !== undefined) {
    updated.rejectCount = data.rejectCount;
  }
  if (data.rejectReason !== undefined) {
    updated.rejectReason = data.rejectReason;
  }
  if (data.delayCount !== undefined) {
    updated.delayCount = data.delayCount;
  }
  if (data.scheduledAt !== undefined) {
    updated.scheduledAt = data.scheduledAt;
  }
  if (data.publishedAt !== undefined) {
    updated.publishedAt = data.publishedAt;
  }
  if (data.archivedAt !== undefined) {
    updated.archivedAt = data.archivedAt;
  }

  db.topics[index] = updated;

  if (data.reviews?.create) {
    const review = {
      id: genId("review"),
      topicId: where.id,
      reviewerId: data.reviews.create.reviewerId,
      result: data.reviews.create.result,
      comment: data.reviews.create.comment,
      createdAt: new Date().toISOString(),
    };
    db.reviews.push(review);
  }

  if (data.revisionRecords?.create) {
    const rev = {
      id: genId("revision"),
      topicId: where.id,
      editorId: data.revisionRecords.create.editorId,
      fieldName: data.revisionRecords.create.fieldName,
      oldValue: data.revisionRecords.create.oldValue,
      newValue: data.revisionRecords.create.newValue,
      reason: data.revisionRecords.create.reason,
      createdAt: new Date().toISOString(),
    };
    db.revisionRecords.push(rev);
  }

  if (data.schedules?.create) {
    const schedule = {
      id: genId("schedule"),
      topicId: where.id,
      schedulerId: data.schedules.create.schedulerId,
      scheduledAt: data.schedules.create.scheduledAt,
      timeSlot: data.schedules.create.timeSlot || null,
      note: data.schedules.create.note || null,
      isPrimary: data.schedules.create.isPrimary !== false,
      createdAt: new Date().toISOString(),
    };
    db.schedules.push(schedule);
  }

  if (data.archiveLogs?.create) {
    const log = {
      id: genId("archive"),
      topicId: where.id,
      reviewerId: data.archiveLogs.create.reviewerId,
      action: data.archiveLogs.create.action,
      comment: data.archiveLogs.create.comment || null,
      createdAt: new Date().toISOString(),
    };
    db.archiveLogs.push(log);
  }

  if (data.statusHistory?.create) {
    const sh = {
      id: genId("sh"),
      topicId: where.id,
      status: data.statusHistory.create.status,
      operatorId: data.statusHistory.create.operatorId,
      remark: data.statusHistory.create.remark,
      createdAt: new Date().toISOString(),
    };
    db.statusHistories.push(sh);
  }

  if (data.conflictDetectedConflicts?.createMany) {
    data.conflictDetectedConflicts.createMany.data.forEach((c: any) => {
      const conflict = {
        id: genId("conflict"),
        topicId: where.id,
        conflictingTopicId: c.conflictingTopicId,
        conflictType: c.conflictType,
        description: c.description,
        resolved: false,
        createdAt: new Date().toISOString(),
      };
      db.scheduleConflicts.push(conflict);
    });
  }

  return findUniqueTopic({ id: where.id });
}

export const memoryDb = {
  user: {
    findUnique: (args: any) => Promise.resolve(clone(findUser(args.where))),
    findMany: (args: any) => Promise.resolve(clone(findManyUsers(args))),
  },
  category: {
    findMany: (args: any) => Promise.resolve(clone(findManyCategories(args))),
  },
  topic: {
    findMany: (args: any) => Promise.resolve(clone(findManyTopics(args))),
    findUnique: (args: any) =>
      Promise.resolve(clone(findUniqueTopic(args.where, args.include))),
    count: (args: any) => Promise.resolve(countTopics(args.where)),
    create: (args: any) => Promise.resolve(clone(createTopic(args.data))),
    update: (args: any) => Promise.resolve(clone(updateTopic(args.where, args.data))),
  },
  review: {},
  schedule: {},
  revisionRecord: {},
  archiveLog: {},
  statusHistory: {},
  scheduleConflict: {},
};

export default memoryDb;
