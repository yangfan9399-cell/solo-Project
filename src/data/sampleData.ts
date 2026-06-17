import type {
  DynastyRule,
  Project,
  SuspectedReplacement,
  ProjectVersion,
  Annotation,
  AnomalyReport,
  ExportSummary
} from "../types";

export const dynastyRules: DynastyRule[] = [
  {
    id: "DR-001",
    dynasty: "西汉",
    emperor: "汉高祖",
    reignTitle: "刘邦",
    tabooCharacter: "邦",
    replacementCharacter: "国",
    reason: "避汉高祖刘邦讳",
    startYear: -202,
    endYear: -195,
    severity: "strict",
    sources: ["《史记·高祖本纪》", "《汉书·高帝纪》"]
  },
  {
    id: "DR-002",
    dynasty: "西汉",
    emperor: "汉文帝",
    reignTitle: "刘恒",
    tabooCharacter: "恒",
    replacementCharacter: "常",
    reason: "避汉文帝刘恒讳",
    startYear: -179,
    endYear: -157,
    severity: "strict",
    sources: ["《汉书·文帝纪》"]
  },
  {
    id: "DR-003",
    dynasty: "西汉",
    emperor: "汉景帝",
    reignTitle: "刘启",
    tabooCharacter: "启",
    replacementCharacter: "开",
    reason: "避汉景帝刘启讳",
    startYear: -156,
    endYear: -141,
    severity: "strict",
    sources: ["《汉书·景帝纪》"]
  },
  {
    id: "DR-004",
    dynasty: "西汉",
    emperor: "汉武帝",
    reignTitle: "刘彻",
    tabooCharacter: "彻",
    replacementCharacter: "通",
    reason: "避汉武帝刘彻讳",
    startYear: -140,
    endYear: -87,
    severity: "strict",
    sources: ["《汉书·武帝纪》"]
  },
  {
    id: "DR-005",
    dynasty: "东汉",
    emperor: "汉光武帝",
    reignTitle: "刘秀",
    tabooCharacter: "秀",
    replacementCharacter: "茂",
    reason: "避汉光武帝刘秀讳",
    startYear: 25,
    endYear: 57,
    severity: "strict",
    sources: ["《后汉书·光武帝纪》"]
  },
  {
    id: "DR-006",
    dynasty: "东汉",
    emperor: "汉明帝",
    reignTitle: "刘庄",
    tabooCharacter: "庄",
    replacementCharacter: "严",
    reason: "避汉明帝刘庄讳",
    startYear: 58,
    endYear: 75,
    severity: "strict",
    sources: ["《后汉书·显宗孝明帝纪》"]
  },
  {
    id: "DR-007",
    dynasty: "西晋",
    emperor: "晋宣帝",
    reignTitle: "司马懿",
    tabooCharacter: "懿",
    replacementCharacter: "茂",
    reason: "避晋宣帝司马懿讳",
    startYear: 265,
    endYear: 420,
    severity: "moderate",
    sources: ["《晋书·宣帝纪》"]
  },
  {
    id: "DR-008",
    dynasty: "西晋",
    emperor: "晋文帝",
    reignTitle: "司马昭",
    tabooCharacter: "昭",
    replacementCharacter: "明",
    reason: "避晋文帝司马昭讳",
    startYear: 265,
    endYear: 420,
    severity: "moderate",
    sources: ["《晋书·文帝纪》"]
  },
  {
    id: "DR-009",
    dynasty: "西晋",
    emperor: "晋武帝",
    reignTitle: "司马炎",
    tabooCharacter: "炎",
    replacementCharacter: "兴",
    reason: "避晋武帝司马炎讳",
    startYear: 265,
    endYear: 290,
    severity: "moderate",
    sources: ["《晋书·武帝纪》"]
  },
  {
    id: "DR-010",
    dynasty: "唐",
    emperor: "唐高祖",
    reignTitle: "李渊",
    tabooCharacter: "渊",
    replacementCharacter: "深",
    reason: "避唐高祖李渊讳",
    startYear: 618,
    endYear: 626,
    severity: "strict",
    sources: ["《旧唐书·高祖本纪》"]
  },
  {
    id: "DR-011",
    dynasty: "唐",
    emperor: "唐太宗",
    reignTitle: "李世民",
    tabooCharacter: "世",
    replacementCharacter: "代",
    reason: "避唐太宗李世民讳（世字）",
    startYear: 626,
    endYear: 649,
    severity: "strict",
    sources: ["《旧唐书·太宗本纪》"]
  },
  {
    id: "DR-012",
    dynasty: "唐",
    emperor: "唐太宗",
    reignTitle: "李世民",
    tabooCharacter: "民",
    replacementCharacter: "人",
    reason: "避唐太宗李世民讳（民字）",
    startYear: 626,
    endYear: 649,
    severity: "strict",
    sources: ["《旧唐书·太宗本纪》"]
  },
  {
    id: "DR-013",
    dynasty: "唐",
    emperor: "唐高宗",
    reignTitle: "李治",
    tabooCharacter: "治",
    replacementCharacter: "理",
    reason: "避唐高宗李治讳",
    startYear: 649,
    endYear: 683,
    severity: "strict",
    sources: ["《旧唐书·高宗本纪》"]
  },
  {
    id: "DR-014",
    dynasty: "宋",
    emperor: "宋太祖",
    reignTitle: "赵匡胤",
    tabooCharacter: "匡",
    replacementCharacter: "正",
    reason: "避宋太祖赵匡胤讳（匡字）",
    startYear: 960,
    endYear: 976,
    severity: "strict",
    sources: ["《宋史·太祖本纪》"]
  },
  {
    id: "DR-015",
    dynasty: "宋",
    emperor: "宋太祖",
    reignTitle: "赵匡胤",
    tabooCharacter: "胤",
    replacementCharacter: "裔",
    reason: "避宋太祖赵匡胤讳（胤字）",
    startYear: 960,
    endYear: 976,
    severity: "strict",
    sources: ["《宋史·太祖本纪》"]
  },
  {
    id: "DR-016",
    dynasty: "宋",
    emperor: "宋真宗",
    reignTitle: "赵恒",
    tabooCharacter: "恒",
    replacementCharacter: "常",
    reason: "避宋真宗赵恒讳",
    startYear: 997,
    endYear: 1022,
    severity: "moderate",
    sources: ["《宋史·真宗本纪》"]
  },
  {
    id: "DR-017",
    dynasty: "宋",
    emperor: "宋仁宗",
    reignTitle: "赵祯",
    tabooCharacter: "祯",
    replacementCharacter: "真",
    reason: "避宋仁宗赵祯讳",
    startYear: 1022,
    endYear: 1063,
    severity: "strict",
    sources: ["《宋史·仁宗本纪》"]
  },
  {
    id: "DR-018",
    dynasty: "宋",
    emperor: "宋英宗",
    reignTitle: "赵曙",
    tabooCharacter: "曙",
    replacementCharacter: "晓",
    reason: "避宋英宗赵曙讳",
    startYear: 1063,
    endYear: 1067,
    severity: "mild",
    sources: ["《宋史·英宗本纪》"]
  },
  {
    id: "DR-019",
    dynasty: "清",
    emperor: "康熙帝",
    reignTitle: "玄烨",
    tabooCharacter: "玄",
    replacementCharacter: "元",
    reason: "避康熙帝玄烨讳（玄字）",
    startYear: 1661,
    endYear: 1722,
    severity: "strict",
    sources: ["《清史稿·圣祖本纪》"]
  },
  {
    id: "DR-020",
    dynasty: "清",
    emperor: "康熙帝",
    reignTitle: "玄烨",
    tabooCharacter: "烨",
    replacementCharacter: "耀",
    reason: "避康熙帝玄烨讳（烨字）",
    startYear: 1661,
    endYear: 1722,
    severity: "strict",
    sources: ["《清史稿·圣祖本纪》"]
  },
  {
    id: "DR-021",
    dynasty: "清",
    emperor: "雍正帝",
    reignTitle: "胤禛",
    tabooCharacter: "胤",
    replacementCharacter: "允",
    reason: "避雍正帝胤禛讳（胤字）",
    startYear: 1722,
    endYear: 1735,
    severity: "strict",
    sources: ["《清史稿·世宗本纪》"]
  },
  {
    id: "DR-022",
    dynasty: "清",
    emperor: "乾隆帝",
    reignTitle: "弘历",
    tabooCharacter: "弘",
    replacementCharacter: "宏",
    reason: "避乾隆帝弘历讳（弘字）",
    startYear: 1735,
    endYear: 1796,
    severity: "strict",
    sources: ["《清史稿·高宗本纪》"]
  },
  {
    id: "DR-023",
    dynasty: "清",
    emperor: "乾隆帝",
    reignTitle: "弘历",
    tabooCharacter: "曆",
    replacementCharacter: "歷",
    reason: "避乾隆帝弘历讳（曆字）",
    startYear: 1735,
    endYear: 1796,
    severity: "strict",
    sources: ["《清史稿·高宗本纪》"]
  },
  {
    id: "DR-024",
    dynasty: "清",
    emperor: "嘉庆帝",
    reignTitle: "顒琰",
    tabooCharacter: "顒",
    replacementCharacter: "永",
    reason: "避嘉庆帝顒琰讳",
    startYear: 1796,
    endYear: 1820,
    severity: "moderate",
    sources: ["《清史稿·仁宗本纪》"]
  },
  {
    id: "DR-025",
    dynasty: "清",
    emperor: "道光帝",
    reignTitle: "旻宁",
    tabooCharacter: "宁",
    replacementCharacter: "甯",
    reason: "避道光帝旻宁讳",
    startYear: 1820,
    endYear: 1850,
    severity: "moderate",
    sources: ["《清史稿·宣宗本纪》"]
  }
];

const poem1 = `汉高祖刘邦起于丰沛，斩白蛇而举义，终破项羽于垓下。其兴邦之策，首在约法三章，废除秦之苛政。
文帝刘恒即位，轻徭薄赋，与民休息，海内殷富，兴于礼义。其恒德不怠，开启文景之治。
景帝刘启继承父志，削藩平乱，启导太平。然七国之乱，亦其失策之徵也。
武帝刘彻承累世之资，北伐匈奴，开疆拓土。董仲舒倡独尊儒术，儒学遂为正统。司马迁撰史记，叙事彻明，为史家之绝唱。
光武刘秀起兵南阳，中兴汉室，重建洛阳。其英明神武，茂勋卓著，史称光武中兴。
明帝刘庄继统，严以驭下，而吏治清明。遣班超使西域，复通丝绸之路。`;

const poem2 = `唐高祖李渊起兵太原，建立大唐，深根固本，开创新局。
太宗李世民励精图治，从谏如流。代有贤臣，房玄龄、杜如晦运筹帷幄；魏征直言进谏，以人为镜。世人谓之贞观之治。
高宗李治承贞观遗风，以理天下，国力日盛。然晚年多病，武后渐掌朝政。
玄宗李隆基开元盛世，百业兴旺。杜甫诗圣，李白诗仙，交相辉映。其文治武功，炎汉盛唐，并称于史。
宋太祖赵匡胤陈桥兵变，黄袍加身。正本清源，杯酒释兵权，重文轻武。帝裔绵延，三百年基业。
真宗赵恒与辽澶渊之盟，岁贡岁币，换得百年和平。民间富庶，商业繁盛。
仁宗赵祯在位四十二年，政治清明，真贤辈出。范仲淹、欧阳修、包拯，皆为一时之选。`;

const poem3 = `清圣祖玄烨八岁即位，智擒鳌拜，亲裁大政。三次亲征噶尔丹，平定三藩，收复台湾。改玄为元，避帝讳也。其文韬武略，光耀千秋，史称康熙盛世。
世宗胤禛承继大统，整顿吏治，火耗归公，摊丁入亩。改胤为允，弟兄皆避御讳。其勤政爱民，夙夜在公。
高宗弘历十全老人，文治武功，自称十全。改弘为宏，改曆为歷，避讳甚严。四库全书之编纂，集古典文化之大成。
仁宗顒琰诛和珅，整肃朝纲。改顒为永，以示谦抑。然内忧外患，已伏其端。
宣宗旻宁厉行节俭，布衣草履。改宁为甯，宫廷内外谨遵。然鸦片战争爆发，国运始衰。
综观有清一代，避讳之制，远迈前朝。康雍乾三朝，文字狱屡兴，读书人动辄得咎，言论不自由之甚也。`;

function generateReplacements(
  projectId: string,
  text: string,
  ruleIds: string[]
): SuspectedReplacement[] {
  const reps: SuspectedReplacement[] = [];
  const applicableRules = dynastyRules.filter(r => ruleIds.includes(r.id));
  let offset = 0;
  let idx = 0;

  for (const rule of applicableRules) {
    let pos = text.indexOf(rule.tabooCharacter, 0);
    while (pos !== -1) {
      reps.push({
        id: `REP-${projectId}-${idx.toString().padStart(4, "0")}`,
        projectId,
        position: pos,
        originalChar: rule.tabooCharacter,
        tabooChar: rule.tabooCharacter,
        replacementChar: rule.replacementCharacter,
        contextBefore: text.substring(Math.max(0, pos - 15), pos),
        contextAfter: text.substring(pos + 1, Math.min(text.length, pos + 16)),
        dynastyRuleId: rule.id,
        confidence: Math.random() * 0.3 + 0.7,
        status: idx < 2 ? "pending" : idx < 4 ? "confirmed" : idx < 5 ? "rejected" : idx < 6 ? "manual" : "pending",
        reviewedBy: idx >= 2 && idx < 5 ? "张校勘" : undefined,
        reviewedAt: idx >= 2 && idx < 5 ? "2025-03-15T10:30:00Z" : undefined,
        note: idx === 4 ? "此处为专名，不须避讳。" : idx === 5 ? "需对照不同版本后再定。" : undefined
      });
      idx++;
      pos = text.indexOf(rule.tabooCharacter, pos + 1);
      if (idx >= 30) break;
    }
    if (idx >= 30) break;
  }
  return reps;
}

export const projects: Project[] = [
  {
    id: "PROJ-2025-001",
    name: "《史记·汉兴以来诸侯王年表》校读",
    textName: "汉兴以来诸侯王年表",
    author: "司马迁",
    dynasty: "清乾隆刻本",
    sourceDynasty: "西汉",
    description: "对乾隆武英殿本《史记》中汉代相关部分进行避讳字审读，重点核对汉高祖至汉武帝诸帝讳字。",
    originalText: poem1,
    currentText: poem1,
    status: "in_review",
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-03-15T14:32:00Z",
    createdBy: "李研究员",
    assignee: "张校勘",
    dynastyRuleIds: ["DR-001", "DR-002", "DR-003", "DR-004", "DR-005", "DR-006"],
    totalSuspected: 12,
    confirmedCount: 6,
    rejectedCount: 2,
    pendingCount: 3,
    manualCount: 1,
    anomalyCount: 1,
    priority: "high",
    dueDate: "2025-04-01",
    tags: ["史记", "汉代", "殿本", "重点项目"],
    batchId: "BATCH-2025-HAN-01"
  },
  {
    id: "PROJ-2025-002",
    name: "《资治通鉴·唐纪》康熙抄本校勘",
    textName: "资治通鉴·唐纪",
    author: "司马光",
    dynasty: "清康熙抄本",
    sourceDynasty: "宋",
    description: "国家图书馆藏康熙年间抄本《资治通鉴》唐纪部分，存在大量唐、宋、清三朝叠层避讳现象，需逐字审读。",
    originalText: poem2,
    currentText: poem2,
    status: "in_review",
    createdAt: "2025-02-01T09:15:00Z",
    updatedAt: "2025-03-14T11:20:00Z",
    createdBy: "王教授",
    assignee: "张校勘",
    dynastyRuleIds: ["DR-010", "DR-011", "DR-012", "DR-013", "DR-014", "DR-015", "DR-016", "DR-017", "DR-019", "DR-020"],
    totalSuspected: 24,
    confirmedCount: 10,
    rejectedCount: 3,
    pendingCount: 8,
    manualCount: 3,
    anomalyCount: 2,
    priority: "high",
    dueDate: "2025-05-15",
    tags: ["资治通鉴", "唐代", "宋代", "康熙抄本", "多层避讳"],
    batchId: "BATCH-2025-TANG-01"
  },
  {
    id: "PROJ-2025-003",
    name: "《清史稿·本纪》抽读批次",
    textName: "清史稿·本纪",
    author: "赵尔巽",
    dynasty: "民国活字本",
    sourceDynasty: "清",
    description: "中华书局藏民国活字本《清史稿》本纪部分，抽审清代五朝避讳情况。",
    originalText: poem3,
    currentText: poem3,
    status: "draft",
    createdAt: "2025-03-01T14:00:00Z",
    updatedAt: "2025-03-10T08:45:00Z",
    createdBy: "陈教授",
    assignee: "李助手",
    dynastyRuleIds: ["DR-019", "DR-020", "DR-021", "DR-022", "DR-023", "DR-024", "DR-025"],
    totalSuspected: 18,
    confirmedCount: 0,
    rejectedCount: 0,
    pendingCount: 18,
    manualCount: 0,
    anomalyCount: 3,
    priority: "medium",
    dueDate: "2025-06-30",
    tags: ["清史稿", "清代", "民国本", "待审"],
    batchId: "BATCH-2025-QING-01"
  },
  {
    id: "PROJ-2025-004",
    name: "《汉书·文帝纪》景祐本异文",
    textName: "汉书·文帝纪",
    author: "班固",
    dynasty: "宋景祐刻本",
    sourceDynasty: "东汉",
    description: "宋景祐年间国子监刻本《汉书》与汲古阁本对校，重点关注宋代避讳对汉代讳字的叠加影响。",
    originalText: poem1,
    currentText: poem1,
    status: "reviewed",
    createdAt: "2024-11-05T10:30:00Z",
    updatedAt: "2025-01-20T16:00:00Z",
    createdBy: "李研究员",
    assignee: "王教授",
    dynastyRuleIds: ["DR-002", "DR-016", "DR-017"],
    totalSuspected: 9,
    confirmedCount: 7,
    rejectedCount: 1,
    pendingCount: 0,
    manualCount: 1,
    anomalyCount: 0,
    priority: "medium",
    dueDate: "2025-01-31",
    tags: ["汉书", "宋代刻本", "已审", "叠层避讳"],
    batchId: "BATCH-2024-SONG-02"
  },
  {
    id: "PROJ-2025-005",
    name: "《晋书·宣帝纪》百衲本校读",
    textName: "晋书·宣帝纪",
    author: "房玄龄",
    dynasty: "宋刻百衲本",
    sourceDynasty: "唐",
    description: "百衲本《晋书》中西晋诸帝讳字的审读与他本对勘。",
    originalText: poem2,
    currentText: poem2,
    status: "exported",
    createdAt: "2024-10-12T13:45:00Z",
    updatedAt: "2025-02-28T09:10:00Z",
    createdBy: "王教授",
    assignee: "张校勘",
    dynastyRuleIds: ["DR-007", "DR-008", "DR-009"],
    totalSuspected: 15,
    confirmedCount: 13,
    rejectedCount: 2,
    pendingCount: 0,
    manualCount: 0,
    anomalyCount: 0,
    priority: "low",
    dueDate: "2025-03-15",
    tags: ["晋书", "西晋", "百衲本", "已导出"],
    batchId: "BATCH-2024-JIN-01"
  },
  {
    id: "PROJ-2025-006",
    name: "《全唐诗》康熙扬州诗局本（太宗卷）",
    textName: "全唐诗·太宗卷",
    author: "曹寅 编纂",
    dynasty: "清康熙扬州诗局本",
    sourceDynasty: "唐",
    description: "康熙扬州诗局本《全唐诗》太宗朝卷中，唐讳与清讳同时出现，需要分层确认。",
    originalText: poem2,
    currentText: poem2,
    status: "archived",
    createdAt: "2024-06-20T11:00:00Z",
    updatedAt: "2024-12-01T14:20:00Z",
    createdBy: "陈教授",
    assignee: "李助手",
    dynastyRuleIds: ["DR-011", "DR-012", "DR-013", "DR-019", "DR-020"],
    totalSuspected: 8,
    confirmedCount: 6,
    rejectedCount: 1,
    pendingCount: 0,
    manualCount: 1,
    anomalyCount: 0,
    priority: "low",
    tags: ["全唐诗", "康熙本", "已归档", "唐清双讳"],
    batchId: "BATCH-2024-POEM-03"
  }
];

export const suspectedReplacements: SuspectedReplacement[] = [
  ...generateReplacements("PROJ-2025-001", poem1, ["DR-001", "DR-002", "DR-003", "DR-004", "DR-005", "DR-006"]),
  ...generateReplacements("PROJ-2025-002", poem2, ["DR-010", "DR-011", "DR-012", "DR-013", "DR-014", "DR-015", "DR-016", "DR-017"]),
  ...generateReplacements("PROJ-2025-003", poem3, ["DR-019", "DR-020", "DR-021", "DR-022", "DR-023", "DR-024", "DR-025"]),
  ...generateReplacements("PROJ-2025-004", poem1, ["DR-002", "DR-016", "DR-017"]),
  ...generateReplacements("PROJ-2025-005", poem2, ["DR-007", "DR-008", "DR-009"]),
  ...generateReplacements("PROJ-2025-006", poem2, ["DR-011", "DR-012", "DR-013", "DR-019", "DR-020"])
];

export const projectVersions: ProjectVersion[] = [
  {
    id: "VER-P001-V1",
    projectId: "PROJ-2025-001",
    versionNumber: "1.0",
    batchId: "BATCH-2025-HAN-01",
    createdAt: "2025-01-10T08:00:00Z",
    createdBy: "李研究员",
    snapshot: projects[0],
    replacementsSnapshot: generateReplacements("PROJ-2025-001", poem1, ["DR-001", "DR-002", "DR-003", "DR-004", "DR-005", "DR-006"]),
    changeSummary: "初始版本导入，完成疑似替换字自动检测",
    comment: "项目建立，载入乾隆殿本《史记》原文"
  },
  {
    id: "VER-P001-V2",
    projectId: "PROJ-2025-001",
    versionNumber: "1.1",
    batchId: "BATCH-2025-HAN-01",
    createdAt: "2025-02-05T15:30:00Z",
    createdBy: "张校勘",
    snapshot: { ...projects[0], confirmedCount: 4, pendingCount: 6 },
    replacementsSnapshot: generateReplacements("PROJ-2025-001", poem1, ["DR-001", "DR-002", "DR-003", "DR-004", "DR-005", "DR-006"]),
    changeSummary: "确认高祖讳4处，文帝讳2处；驳回误判2处",
    comment: "完成第一轮初审，待复核景帝、武帝讳"
  },
  {
    id: "VER-P001-V3",
    projectId: "PROJ-2025-001",
    versionNumber: "1.2",
    batchId: "BATCH-2025-HAN-01",
    createdAt: "2025-03-15T14:32:00Z",
    createdBy: "张校勘",
    snapshot: projects[0],
    replacementsSnapshot: generateReplacements("PROJ-2025-001", poem1, ["DR-001", "DR-002", "DR-003", "DR-004", "DR-005", "DR-006"]),
    changeSummary: "续确认光武帝、明帝讳；新增1处人工干预标记",
    comment: "第二轮审核中，发现1处疑似不一致，已记为异常"
  },
  {
    id: "VER-P002-V1",
    projectId: "PROJ-2025-002",
    versionNumber: "1.0",
    batchId: "BATCH-2025-TANG-01",
    createdAt: "2025-02-01T09:15:00Z",
    createdBy: "王教授",
    snapshot: projects[1],
    replacementsSnapshot: generateReplacements("PROJ-2025-002", poem2, ["DR-010", "DR-011", "DR-012", "DR-013"]),
    changeSummary: "初始版本，完成唐、宋、清三朝讳字初步识别",
    comment: "多层避讳复杂，建议逐字人工复核"
  },
  {
    id: "VER-P002-V2",
    projectId: "PROJ-2025-002",
    versionNumber: "1.1",
    batchId: "BATCH-2025-TANG-01",
    createdAt: "2025-03-14T11:20:00Z",
    createdBy: "张校勘",
    snapshot: projects[1],
    replacementsSnapshot: generateReplacements("PROJ-2025-002", poem2, ["DR-010", "DR-011", "DR-012", "DR-013"]),
    changeSummary: "确认太宗讳10处、高宗讳2处，驳回误判3处",
    comment: "康熙抄本中宋讳与唐讳混杂，需对照底本"
  }
];

export const annotations: Annotation[] = [
  {
    id: "ANN-001",
    projectId: "PROJ-2025-001",
    replacementId: suspectedReplacements[4]?.id,
    position: 32,
    type: "replacement",
    content: "此处「邦」字在《汉书》中作「国」，但此段为司马迁原文，当为后人改易，需注明。",
    author: "张校勘",
    createdAt: "2025-02-10T09:30:00Z",
    resolved: true,
    resolvedBy: "李研究员",
    resolvedAt: "2025-02-12T10:15:00Z"
  },
  {
    id: "ANN-002",
    projectId: "PROJ-2025-001",
    replacementId: suspectedReplacements[5]?.id,
    position: 78,
    type: "query",
    content: "此处「恒」字若为谥号中字，是否当避？请李研究员确认。",
    author: "张校勘",
    createdAt: "2025-02-20T11:00:00Z",
    resolved: false
  },
  {
    id: "ANN-003",
    projectId: "PROJ-2025-002",
    replacementId: suspectedReplacements[18]?.id,
    position: 45,
    type: "reference",
    content: "参见《旧唐书·太宗本纪》卷二，「世民」二字并讳，改「王世充」为「王充」例。",
    author: "王教授",
    createdAt: "2025-03-01T14:20:00Z",
    resolved: false
  },
  {
    id: "ANN-004",
    projectId: "PROJ-2025-002",
    position: 210,
    type: "issue",
    content: "康熙抄本此页缺字，补入部分与宋本避讳不一致，已另记异常。",
    author: "张校勘",
    createdAt: "2025-03-10T16:45:00Z",
    resolved: true,
    resolvedBy: "王教授",
    resolvedAt: "2025-03-12T09:00:00Z"
  },
  {
    id: "ANN-005",
    projectId: "PROJ-2025-003",
    replacementId: suspectedReplacements[42]?.id,
    position: 88,
    type: "comment",
    content: "「玄」改「元」为康熙朝通例，此段无异议。",
    author: "李助手",
    createdAt: "2025-03-08T10:10:00Z",
    resolved: false
  },
  {
    id: "ANN-006",
    projectId: "PROJ-2025-003",
    position: 340,
    type: "query",
    content: "道光朝「宁」字避讳与嘉庆朝「顒」字是否在同一段文本中出现？需确认时间段。",
    author: "陈教授",
    createdAt: "2025-03-12T15:55:00Z",
    resolved: false
  }
];

export const anomalyReports: AnomalyReport[] = [
  {
    id: "ANM-001",
    projectId: "PROJ-2025-001",
    type: "inconsistency",
    severity: "warning",
    description: "同一章节中「启」字出现5次，其中3处改为「开」、2处未改，存在不一致。",
    affectedReplacements: [suspectedReplacements[6]?.id || "", suspectedReplacements[7]?.id || ""],
    detectedAt: "2025-03-01T08:00:00Z",
    resolved: false,
    suggestedAction: "核对底本并与景帝纪同段互校，确认是否为后人改补。"
  },
  {
    id: "ANM-002",
    projectId: "PROJ-2025-002",
    type: "character_collision",
    severity: "critical",
    description: "「祯」字同时触发宋仁宗讳（改真）与康熙讳潜在干扰，出现替换冲突。",
    affectedReplacements: [suspectedReplacements[28]?.id || ""],
    detectedAt: "2025-03-05T09:30:00Z",
    resolved: false,
    suggestedAction: "判定文本时代归属，宋刻与清抄的避讳规则不能混用，需按底本年代分层。"
  },
  {
    id: "ANM-003",
    projectId: "PROJ-2025-002",
    type: "missing_rule",
    severity: "warning",
    description: "文本中「曆」字多次出现，疑似避乾隆讳，但未命中现有规则。",
    affectedReplacements: [],
    detectedAt: "2025-03-10T11:00:00Z",
    resolved: false,
    suggestedAction: "增补「DR-023 曆→歷」规则至本项目审读规则库，并回溯匹配。"
  },
  {
    id: "ANM-004",
    projectId: "PROJ-2025-003",
    type: "unexpected_pattern",
    severity: "info",
    description: "「弘」与「宏」同时出现于相邻段落，疑似改字未完成。",
    affectedReplacements: [suspectedReplacements[48]?.id || ""],
    detectedAt: "2025-03-09T14:20:00Z",
    resolved: false,
    suggestedAction: "与其他版本对校，判断是否为原本即此写法。"
  },
  {
    id: "ANM-005",
    projectId: "PROJ-2025-003",
    type: "inconsistency",
    severity: "critical",
    description: "道光朝「宁」避讳规则在同一页中前后不一致，一处改为「甯」，一处仍作「宁」。",
    affectedReplacements: [suspectedReplacements[54]?.id || "", suspectedReplacements[55]?.id || ""],
    detectedAt: "2025-03-11T16:00:00Z",
    resolved: false,
    suggestedAction: "检查是否为补版或剜改痕迹，需核对原版书影。"
  },
  {
    id: "ANM-006",
    projectId: "PROJ-2025-003",
    type: "version_conflict",
    severity: "warning",
    description: "「胤」字避讳在不同版本记录中存在冲突，有改「允」和改「裔」两种说法。",
    affectedReplacements: [],
    detectedAt: "2025-03-13T10:45:00Z",
    resolved: true,
    suggestedAction: "已核实：清讳改「胤」为「允」，宋讳改「胤」为「裔」，分别属不同朝代规则。"
  }
];

export const exportSummaries: ExportSummary[] = [
  {
    id: "EXP-001",
    projectId: "PROJ-2025-005",
    versionId: "VER-P005-V2",
    exportedAt: "2025-02-28T09:10:00Z",
    exportedBy: "张校勘",
    format: "json",
    summaryContent: "《晋书·宣帝纪》百衲本校读完成。共检出西晋避讳字15处，其中确认13处（司马讳改「懿」为「茂」、改「昭」为「明」、改「炎」为「兴」），驳回2处（专名不避）。",
    stats: {
      totalCharacters: poem2.length,
      totalReplacements: 15,
      confirmed: 13,
      rejected: 2,
      manual: 0,
      annotations: 2,
      dynastiesCovered: ["西晋"]
    }
  },
  {
    id: "EXP-002",
    projectId: "PROJ-2025-004",
    versionId: "VER-P004-V1",
    exportedAt: "2025-01-20T16:00:00Z",
    exportedBy: "王教授",
    format: "csv",
    summaryContent: "《汉书·文帝纪》景祐本异文校读。汉代避讳与宋代避讳叠层出现，共检出9处，其中宋真宗讳「恒」改「常」4处，宋仁宗讳「祯」改「真」3处，汉文帝讳「恒」改「常」（汉讳与宋讳同字巧合）2处。",
    stats: {
      totalCharacters: poem1.length,
      totalReplacements: 9,
      confirmed: 7,
      rejected: 1,
      manual: 1,
      annotations: 1,
      dynastiesCovered: ["西汉", "北宋"]
    }
  }
];
