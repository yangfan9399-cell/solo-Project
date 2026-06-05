import { PrismaClient, UserRole, TopicStatus, ReviewResult, ScheduleConflictType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始初始化种子数据...");

  // 1. 创建用户（不同角色）
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "editor1@example.com" },
      update: {},
      create: {
        name: "张编辑",
        email: "editor1@example.com",
        role: UserRole.EDITOR,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=editor1",
      },
    }),
    prisma.user.upsert({
      where: { email: "editor2@example.com" },
      update: {},
      create: {
        name: "李编辑",
        email: "editor2@example.com",
        role: UserRole.EDITOR,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=editor2",
      },
    }),
    prisma.user.upsert({
      where: { email: "chief@example.com" },
      update: {},
      create: {
        name: "王主编",
        email: "chief@example.com",
        role: UserRole.CHIEF_EDITOR,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chief",
      },
    }),
    prisma.user.upsert({
      where: { email: "scheduler@example.com" },
      update: {},
      create: {
        name: "赵排期",
        email: "scheduler@example.com",
        role: UserRole.SCHEDULER,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=scheduler",
      },
    }),
    prisma.user.upsert({
      where: { email: "reviewer@example.com" },
      update: {},
      create: {
        name: "陈复核",
        email: "reviewer@example.com",
        role: UserRole.REVIEWER,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=reviewer",
      },
    }),
  ]);

  const [editor1, editor2, chief, scheduler, reviewer] = await users;
  console.log("✅ 用户数据创建完成");

  // 2. 创建栏目分类
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "科技" },
      update: {},
      create: { name: "科技", description: "科技新闻与互联网行业动态" },
    }),
    prisma.category.upsert({
      where: { name: "财经" },
      update: {},
      create: { name: "财经", description: "财经资讯与市场分析" },
    }),
    prisma.category.upsert({
      where: { name: "文化" },
      update: {},
      create: { name: "文化", description: "文化艺术与生活方式" },
    }),
    prisma.category.upsert({
      where: { name: "体育" },
      update: {},
      create: { name: "体育", description: "体育赛事与运动健康" },
    }),
  ]);

  const [techCategory, financeCategory, cultureCategory, sportsCategory] = await categories;
  console.log("✅ 栏目分类创建完成");

  // 3. 创建选题样本
  const topicsData = [
    {
      title: "人工智能大模型技术突破：新一代多模态模型发布",
      originalTitle: null,
      summary: "某科技公司发布新一代多模态大模型，在多项基准测试中刷新多项记录。",
      source: "科技新闻网",
      sourceUrl: "https://example.com/ai-breakthrough",
      categoryId: techCategory.id,
      copyrightEvidence: "已获得原创授权书，编号：CR-2026-001",
      contentOutline: "1. 背景介绍\n2. 技术原理\n3. 应用场景\n4. 未来展望",
      status: TopicStatus.PUBLISHED,
      priority: 1,
      submitterId: editor1.id,
      currentHandlerId: reviewer.id,
      scheduledAt: new Date("2026-06-03T09:00:00"),
      publishedAt: new Date("2026-06-03T09:05:00"),
    },
    {
      title: "全球股市震荡，投资者避险情绪升温",
      originalTitle: null,
      summary: "受多重因素影响，全球股市出现震荡，投资者避险情绪明显升温。",
      source: "财经观察",
      sourceUrl: "https://example.com/stock-market",
      categoryId: financeCategory.id,
      copyrightEvidence: "版权来源：财经观察，已获转载授权",
      contentOutline: "1. 市场行情概述\n2. 影响因素分析\n3. 专家观点\n4. 投资建议",
      status: TopicStatus.APPROVED,
      priority: 2,
      submitterId: editor2.id,
      currentHandlerId: scheduler.id,
    },
    {
      title: "知名导演新作上映首日票房破亿",
      originalTitle: null,
      summary: "知名导演最新力作上映首日票房突破亿元大关。",
      source: "娱乐头条",
      sourceUrl: "https://example.com/movie-box-office",
      categoryId: cultureCategory.id,
      copyrightEvidence: "",
      contentOutline: "1. 影片介绍\n2. 票房数据\n3. 观众评价\n4. 行业影响",
      status: TopicStatus.COPYRIGHT_MISSING,
      priority: 3,
      submitterId: editor1.id,
      currentHandlerId: editor1.id,
    },
    {
      title: "欧冠决赛前瞻：两支豪门球队对决",
      originalTitle: "欧冠决赛前瞻",
      summary: "欧冠决赛即将打响，两支豪门球队将展开对决。",
      source: "体育周刊",
      sourceUrl: "https://example.com/champions-league-final",
      categoryId: sportsCategory.id,
      copyrightEvidence: "体育周刊独家授权，版权编号：SP-2026-045",
      contentOutline: "1. 球队介绍\n2. 历史交锋\n3. 关键球员\n4. 比赛预测",
      status: TopicStatus.TITLE_REVISION,
      priority: 2,
      submitterId: editor2.id,
      currentHandlerId: editor2.id,
    },
    {
      title: "新能源汽车销量持续增长，市场竞争加剧",
      originalTitle: null,
      summary: "新能源汽车市场持续火热，销量持续增长，市场竞争日趋激烈。",
      source: "汽车之家",
      sourceUrl: "https://example.com/ev-sales",
      categoryId: techCategory.id,
      copyrightEvidence: "汽车之家授权转载",
      contentOutline: "1. 销量数据\n2. 市场分析\n3. 竞争格局\n4. 发展趋势",
      status: TopicStatus.SCHEDULED,
      priority: 1,
      submitterId: editor1.id,
      currentHandlerId: scheduler.id,
      scheduledAt: new Date("2026-06-08T10:00:00"),
    },
    {
      title: "智能手机市场报告发布，国产品牌表现亮眼",
      originalTitle: null,
      summary: "最新智能手机市场报告发布，国产品牌市场份额持续提升。",
      source: "市场研究机构",
      sourceUrl: "https://example.com/smartphone-report",
      categoryId: techCategory.id,
      copyrightEvidence: "市场研究机构独家数据",
      contentOutline: "1. 市场整体情况\n2. 品牌排名\n3. 技术趋势\n4. 未来展望",
      status: TopicStatus.SCHEDULED,
      priority: 2,
      submitterId: editor2.id,
      currentHandlerId: scheduler.id,
      scheduledAt: new Date("2026-06-08T10:00:00"),
    },
    {
      title: "5G应用场景拓展，工业互联网加速落地",
      originalTitle: null,
      summary: "5G技术应用场景不断拓展，工业互联网加速落地实施。",
      source: "通信世界",
      sourceUrl: "https://example.com/5g-industrial",
      categoryId: techCategory.id,
      copyrightEvidence: "通信世界授权",
      contentOutline: "1. 5G应用现状\n2. 工业互联网案例\n3. 技术挑战\n4. 发展前景",
      status: TopicStatus.SCHEDULED,
      priority: 3,
      submitterId: editor1.id,
      currentHandlerId: scheduler.id,
      scheduledAt: new Date("2026-06-10T14:00:00"),
    },
    {
      title: "传统文化复兴：传统技艺传承人专访",
      originalTitle: null,
      summary: "传统文化复兴浪潮下，传统技艺传承人讲述他们的坚守与创新。",
      source: "文化周刊",
      sourceUrl: "https://example.com/traditional-culture",
      categoryId: cultureCategory.id,
      copyrightEvidence: "文化周刊独家专访授权",
      contentOutline: "1. 技艺介绍\n2. 传承故事\n3. 创新发展\n4. 社会价值",
      status: TopicStatus.DRAFT,
      priority: 3,
      submitterId: editor2.id,
      currentHandlerId: editor2.id,
    },
    {
      title: "楼市调控政策解读",
      originalTitle: null,
      summary: "最新楼市调控政策出台，对市场产生深远影响。",
      source: "财经观察",
      sourceUrl: "https://example.com/property-policy",
      categoryId: financeCategory.id,
      copyrightEvidence: "",
      contentOutline: "1. 政策内容\n2. 市场影响\n3. 专家解读\n4. 未来走势",
      status: TopicStatus.PENDING_REVIEW,
      priority: 1,
      submitterId: editor1.id,
      currentHandlerId: chief.id,
    },
    {
      title: "马拉松赛事热情高涨，跑者故事",
      originalTitle: "马拉松赛事",
      summary: "城市马拉松赛事热情高涨，跑者们的故事让人感动。",
      source: "运动人生",
      sourceUrl: "https://example.com/marathon",
      categoryId: sportsCategory.id,
      copyrightEvidence: "运动人生授权",
      contentOutline: "1. 赛事概况\n2. 跑者故事\n3. 训练心得\n4. 赛事文化",
      status: TopicStatus.ARCHIVED,
      priority: 2,
      delayCount: 2,
      rejectCount: 1,
      submitterId: editor2.id,
      currentHandlerId: reviewer.id,
      scheduledAt: new Date("2026-05-28T08:00:00"),
      publishedAt: new Date("2026-05-28T08:30:00"),
      archivedAt: new Date("2026-05-29T10:00:00"),
    },
    {
      title: "年度经济数据发布",
      originalTitle: null,
      summary: "国家统计局发布最新经济数据，显示经济运行总体平稳。",
      source: "经济日报",
      sourceUrl: "https://example.com/economic-data",
      categoryId: financeCategory.id,
      copyrightEvidence: "经济日报授权转载",
      contentOutline: "1. 数据概览\n2. 分行业分析\n3. 政策解读\n4. 趋势展望",
      status: TopicStatus.PUBLISHED,
      priority: 1,
      delayCount: 1,
      submitterId: editor1.id,
      currentHandlerId: reviewer.id,
      scheduledAt: new Date("2026-06-01T09:00:00"),
      publishedAt: new Date("2026-06-02T09:00:00"),
    },
    {
      title: "电竞赛事报道",
      originalTitle: null,
      summary: "顶级电竞赛事火热进行中，精彩对决吸引全球观众关注。",
      source: "电竞世界",
      sourceUrl: "https://example.com/esports",
      categoryId: sportsCategory.id,
      copyrightEvidence: "",
      contentOutline: "1. 赛事介绍\n2. 战队分析\n3. 选手专访\n4. 产业观察",
      status: TopicStatus.REJECTED,
      priority: 3,
      rejectCount: 1,
      rejectReason: "内容质量不适合体育栏目定位，建议转至科技或文化栏目",
      submitterId: editor2.id,
      currentHandlerId: chief.id,
    },
  ];

  const createdTopics = [];
  for (const topicData of topicsData) {
    const slug = topicData.title
      .replace(/[\s，：、。！？]/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const topic = await prisma.topic.upsert({
      where: { id: `seed-${slug}` },
      update: {},
      create: {
        ...topicData,
        id: `seed-${slug}`,
      },
    });
    createdTopics.push(topic);
  }
  console.log("✅ 选题样本数据创建完成");

  const [
    aiTopic, stockTopic, movieTopic, championsTopic, evTopic, smartphoneTopic, fiveGTopic, cultureTopic, propertyTopic, marathonTopic, economicTopic, esportsTopic,
  ] = createdTopics;

  // 4. 创建审核记录
  const reviews = [
    {
      topicId: aiTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.APPROVED,
      comment: "内容质量高，信息准确，时效性强，同意发布。",
    },
    {
      topicId: stockTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.APPROVED,
      comment: "分析到位，数据详实，同意通过。",
    },
    {
      topicId: movieTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.COPYRIGHT_MISSING,
      comment: "缺少版权授权证明材料，请补充完整的版权授权书或授权协议。",
    },
    {
      topicId: championsTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.TITLE_REVISION,
      comment: "标题过于简单，请修改标题以吸引读者，建议增加更多信息点。",
    },
    {
      topicId: propertyTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.APPROVED,
      comment: "选题重要，时效性强，尽快安排排期。",
    },
    {
      topicId: marathonTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.APPROVED,
      comment: "内容有温度，符合栏目定位。",
    },
    {
      topicId: economicTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.APPROVED,
      comment: "数据权威，分析专业。",
    },
    {
      topicId: esportsTopic.id,
      reviewerId: chief.id,
      result: ReviewResult.REJECTED,
      comment: "内容与体育栏目定位不符，建议转至其他栏目或重新定位。",
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }
  console.log("✅ 审核记录创建完成");

  // 5. 创建排期记录
  const schedules = [
    {
      topicId: aiTopic.id,
      schedulerId: scheduler.id,
      scheduledAt: new Date("2026-06-03T09:00:00"),
      timeSlot: "早间头条",
      note: "重要科技新闻，早间发布效果好。",
    },
    {
      topicId: evTopic.id,
      schedulerId: scheduler.id,
      scheduledAt: new Date("2026-06-08T10:00:00"),
      timeSlot: "上午科技",
      note: "科技栏目重点选题。",
    },
    {
      topicId: smartphoneTopic.id,
      schedulerId: scheduler.id,
      scheduledAt: new Date("2026-06-08T10:00:00"),
      timeSlot: "上午科技",
      note: "与新能源汽车同一时段，可能存在冲突。",
    },
    {
      topicId: fiveGTopic.id,
      schedulerId: scheduler.id,
      scheduledAt: new Date("2026-06-10T14:00:00"),
      timeSlot: "下午深度",
      note: "深度报道，下午发布。",
    },
    {
      topicId: marathonTopic.id,
      schedulerId: scheduler.id,
      scheduledAt: new Date("2026-05-28T08:00:00"),
      timeSlot: "早间体育",
      note: "体育早报。",
    },
    {
      topicId: economicTopic.id,
      schedulerId: scheduler.id,
      scheduledAt: new Date("2026-06-01T09:00:00"),
      timeSlot: "财经早报",
      note: "原定于5月31日发布，因故延期一天。",
    },
  ];

  for (const schedule of schedules) {
    await prisma.schedule.create({ data: schedule });
  }
  console.log("✅ 排期记录创建完成");

  // 6. 创建排期冲突记录
  await prisma.scheduleConflict.create({
    data: {
      topicId: evTopic.id,
      conflictingTopicId: smartphoneTopic.id,
      conflictType: ScheduleConflictType.SAME_CATEGORY,
      description: "两个科技类选题安排在同一时段（6月8日10:00），建议错峰发布。",
    },
  });
  console.log("✅ 排期冲突记录创建完成");

  // 7. 创建修改记录
  const revisions = [
    {
      topicId: championsTopic.id,
      editorId: editor2.id,
      fieldName: "title",
      oldValue: "欧冠决赛前瞻",
      newValue: "欧冠决赛前瞻：两支豪门球队对决",
      reason: "根据主编审核意见，标题需要更具体，增加更多信息点。",
    },
    {
      topicId: marathonTopic.id,
      editorId: editor2.id,
      fieldName: "title",
      oldValue: "马拉松赛事",
      newValue: "马拉松赛事热情高涨，跑者故事",
      reason: "标题修改，增加情感元素。",
    },
  ];

  for (const rev of revisions) {
    await prisma.revisionRecord.create({ data: rev });
  }
  console.log("✅ 修改记录创建完成");

  // 8. 创建归档记录
  await prisma.archiveLog.createMany({
    data: [
      {
        topicId: marathonTopic.id,
        reviewerId: reviewer.id,
        action: "ARCHIVED",
        comment: "发布后数据良好，已归档。",
      },
      {
        topicId: aiTopic.id,
        reviewerId: reviewer.id,
        action: "PUBLISHED",
        comment: "审核通过，已发布。",
      },
    ],
  });
  console.log("✅ 归档记录创建完成");

  // 9. 创建状态历史
  const statusHistories = [
    // AI大模型
    { topicId: aiTopic.id, status: TopicStatus.DRAFT, operatorId: editor1.id, remark: "创建选题草稿" },
    { topicId: aiTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor1.id, remark: "提交审核" },
    { topicId: aiTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    { topicId: aiTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "已排期：6月3日 09:00" },
    { topicId: aiTopic.id, status: TopicStatus.PUBLISHED, operatorId: reviewer.id, remark: "已发布" },
    // 股市
    { topicId: stockTopic.id, status: TopicStatus.DRAFT, operatorId: editor2.id, remark: "创建选题草稿" },
    { topicId: stockTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor2.id, remark: "提交审核" },
    { topicId: stockTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    // 电影
    { topicId: movieTopic.id, status: TopicStatus.DRAFT, operatorId: editor1.id, remark: "创建选题草稿" },
    { topicId: movieTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor1.id, remark: "提交审核" },
    { topicId: movieTopic.id, status: TopicStatus.COPYRIGHT_MISSING, operatorId: chief.id, remark: "版权材料缺失，需补充" },
    // 欧冠
    { topicId: championsTopic.id, status: TopicStatus.DRAFT, operatorId: editor2.id, remark: "创建选题草稿" },
    { topicId: championsTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor2.id, remark: "提交审核" },
    { topicId: championsTopic.id, status: TopicStatus.TITLE_REVISION, operatorId: chief.id, remark: "标题需修改" },
    // 新能源汽车
    { topicId: evTopic.id, status: TopicStatus.DRAFT, operatorId: editor1.id, remark: "创建选题草稿" },
    { topicId: evTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor1.id, remark: "提交审核" },
    { topicId: evTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    { topicId: evTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "已排期：6月8日 10:00" },
    // 智能手机
    { topicId: smartphoneTopic.id, status: TopicStatus.DRAFT, operatorId: editor2.id, remark: "创建选题草稿" },
    { topicId: smartphoneTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor2.id, remark: "提交审核" },
    { topicId: smartphoneTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    { topicId: smartphoneTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "已排期：6月8日 10:00，注意与新能源汽车选题冲突" },
    // 5G
    { topicId: fiveGTopic.id, status: TopicStatus.DRAFT, operatorId: editor1.id, remark: "创建选题草稿" },
    { topicId: fiveGTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor1.id, remark: "提交审核" },
    { topicId: fiveGTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    { topicId: fiveGTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "已排期：6月10日 14:00" },
    // 传统文化
    { topicId: cultureTopic.id, status: TopicStatus.DRAFT, operatorId: editor2.id, remark: "创建选题草稿" },
    // 楼市
    { topicId: propertyTopic.id, status: TopicStatus.DRAFT, operatorId: editor1.id, remark: "创建选题草稿" },
    { topicId: propertyTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor1.id, remark: "提交审核" },
    // 马拉松
    { topicId: marathonTopic.id, status: TopicStatus.DRAFT, operatorId: editor2.id, remark: "创建选题草稿" },
    { topicId: marathonTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor2.id, remark: "提交审核" },
    { topicId: marathonTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    { topicId: marathonTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "已排期：5月28日 08:00" },
    { topicId: marathonTopic.id, status: TopicStatus.PUBLISHED, operatorId: reviewer.id, remark: "已发布" },
    { topicId: marathonTopic.id, status: TopicStatus.ARCHIVED, operatorId: reviewer.id, remark: "已归档" },
    // 经济数据
    { topicId: economicTopic.id, status: TopicStatus.DRAFT, operatorId: editor1.id, remark: "创建选题草稿" },
    { topicId: economicTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor1.id, remark: "提交审核" },
    { topicId: economicTopic.id, status: TopicStatus.APPROVED, operatorId: chief.id, remark: "审核通过" },
    { topicId: economicTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "已排期：5月31日 09:00" },
    { topicId: economicTopic.id, status: TopicStatus.SCHEDULED, operatorId: scheduler.id, remark: "排期调整至6月1日 09:00，延期1天" },
    { topicId: economicTopic.id, status: TopicStatus.PUBLISHED, operatorId: reviewer.id, remark: "已发布" },
    // 电竞
    { topicId: esportsTopic.id, status: TopicStatus.DRAFT, operatorId: editor2.id, remark: "创建选题草稿" },
    { topicId: esportsTopic.id, status: TopicStatus.PENDING_REVIEW, operatorId: editor2.id, remark: "提交审核" },
    { topicId: esportsTopic.id, status: TopicStatus.REJECTED, operatorId: chief.id, remark: "审核不通过，与栏目定位不符" },
  ];

  for (const sh of statusHistories) {
    await prisma.statusHistory.create({ data: sh });
  }
  console.log("✅ 状态历史创建完成");

  console.log("\n🎉 所有种子数据初始化完成！");
  console.log("\n📊 数据概览：");
  console.log(`  - 用户：5 个用户（编辑2、主编1、排期1、复核1）`);
  console.log(`  - 栏目：4 个栏目`);
  console.log(`  - 选题：${createdTopics.length} 个选题`);
  console.log(`  - 审核：8 条审核记录`);
  console.log(`  - 排期：6 条排期记录`);
  console.log(`  - 冲突：1 条排期冲突`);
  console.log(`  - 修改：2 条修改记录`);
}

main()
  .catch((e) => {
    console.error("种子数据初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
