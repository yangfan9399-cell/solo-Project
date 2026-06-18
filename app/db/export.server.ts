import { getAllBatches, getAllRecords, getAllSolutions, getAuditionsByRecord } from "./queries.server";

export function exportBatchesCSV(): string {
  const batches = getAllBatches();
  const headers = [
    "批次号", "唱片编号", "艺术家", "专辑", "清洗液", "刷子类型", "刷洗次数",
    "超声时间(分)", "超声温度(°C)", "漂洗次数", "干燥方式", "干燥时间(分)",
    "操作员", "清洗前噪声", "清洗后噪声", "裂纹减少(%)", "效果评级",
    "异常记录", "备注", "清洗日期",
  ];

  const rows = batches.map((b) => [
    b.batch_code,
    b.record_id,
    escapeCsv(b.artist),
    escapeCsv(b.album),
    escapeCsv(b.solution_name),
    escapeCsv(b.brush_type || ""),
    b.brush_count,
    b.ultrasonic_minutes,
    b.ultrasonic_temp_c ?? "",
    b.rinse_count,
    escapeCsv(b.drying_method || ""),
    b.drying_minutes,
    escapeCsv(b.operator || ""),
    b.pre_noise_level,
    b.post_noise_level,
    b.crackle_reduction,
    `${b.result_rating}/5`,
    escapeCsv(b.anomalies || ""),
    escapeCsv(b.notes || ""),
    b.cleaned_at,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportRecordsCSV(): string {
  const records = getAllRecords();
  const headers = ["目录号", "艺术家", "专辑", "年份", "风格", "品相", "重量(g)", "压片", "备注", "创建时间"];
  const rows = records.map((r) => [
    escapeCsv(r.catalog_no),
    escapeCsv(r.artist),
    escapeCsv(r.album),
    r.year,
    escapeCsv(r.genre || ""),
    r.condition,
    r.weight ?? "",
    escapeCsv(r.pressing || ""),
    escapeCsv(r.notes || ""),
    r.created_at,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportFullReportJSON(): string {
  const records = getAllRecords();
  const solutions = getAllSolutions();
  const batches = getAllBatches();

  const enriched = records.map((r) => ({
    record: r,
    cleaningHistory: getAuditionsByRecord(r.id),
  }));

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      summary: {
        totalRecords: records.length,
        totalBatches: batches.length,
        activeSolutions: solutions.filter((s) => s.is_active).length,
        averageRating: batches.length
          ? (batches.reduce((a, b) => a + b.result_rating, 0) / batches.length).toFixed(2)
          : "N/A",
        averageReduction: batches.length
          ? (batches.reduce((a, b) => a + b.crackle_reduction, 0) / batches.length).toFixed(1) + "%"
          : "N/A",
      },
      solutions,
      recordsWithHistory: enriched,
      cleaningBatches: batches,
    },
    null,
    2
  );
}

export function generateSummaryText(): string {
  const records = getAllRecords();
  const solutions = getAllSolutions();
  const batches = getAllBatches();

  const totalBatches = batches.length;
  const avgRating = totalBatches
    ? (batches.reduce((a, b) => a + b.result_rating, 0) / totalBatches).toFixed(2)
    : "N/A";
  const avgReduction = totalBatches
    ? (batches.reduce((a, b) => a + b.crackle_reduction, 0) / totalBatches).toFixed(1)
    : "N/A";
  const perfectCount = batches.filter((b) => b.result_rating === 5).length;
  const problemCount = batches.filter((b) => b.result_rating <= 2).length;

  return `黑胶清洗批次记录摘要
========================
生成时间: ${new Date().toLocaleString("zh-CN")}

【总览】
  唱片库容量:       ${records.length} 张
  累计清洗批次:     ${totalBatches} 次
  在使用清洗液:     ${solutions.filter((s) => s.is_active).length} 种
  平均效果评级:     ${avgRating}/5
  平均裂纹衰减:     ${avgReduction}%
  五星完美批次:     ${perfectCount} 次
  需关注异常批次:   ${problemCount} 次

【唱片清洗 TOP 5】
${batches
  .slice(0, 5)
  .map(
    (b, i) =>
      `  ${i + 1}. [${b.result_rating}★] ${b.artist} - ${b.album} (${b.solution_name}, ${b.ultrasonic_minutes}min超声)`
  )
  .join("\n")}

【异常数据提醒】
${problemCount > 0
  ? batches
      .filter((b) => b.result_rating <= 2)
      .map((b) => `  ⚠ 批次 ${b.batch_code}: ${b.anomalies || "评级偏低"}`)
      .join("\n")
  : "  无异常"}
`;
}

function escapeCsv(value: string | number): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
