import { For, Show, createSignal } from "solid-js";
import type { Project, Defect, InspectionFrame, ReviewBatch, Version } from "../lib/types";
import { storage } from "../lib/storage";
import { DEFECT_TYPE_LABELS, SEVERITY_LABELS, REVIEW_STATUS_LABELS } from "../lib/types";
import { uid, generateCSV, downloadFile, formatDate, reviewStatusLabel, projectStatusLabel } from "../lib/utils";

interface Props {
  project: Project;
}

export default function ExportPanel(props: Props) {
  const [exporting, setExporting] = createSignal(false);
  const [lastExport, setLastExport] = createSignal("");

  const defects = () => storage.defects.getByProject(props.project.id);
  const frames = () => storage.frames.getByProject(props.project.id);
  const reviews = () => storage.reviews.getByProject(props.project.id);
  const versions = () => storage.versions.getByProject(props.project.id);

  const summary = () => {
    const d = defects();
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    d.forEach((item) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
      byStatus[item.reviewStatus] = (byStatus[item.reviewStatus] || 0) + 1;
    });
    return { total: d.length, byType, bySeverity, byStatus, frames: frames().length, reviews: reviews().length, versions: versions().length };
  };

  const exportSummaryCSV = () => {
    const s = summary();
    const headers = ["项目名称", "管线名称", "管径(mm)", "检测日期", "检测长度(m)", "机器人型号", "项目状态", "缺陷总数", "帧数", "复核批次数", "版本数"];
    const row = [props.project.name, props.project.pipelineName, String(props.project.pipelineDiameter), props.project.inspectionDate, String(props.project.inspectionLength), props.project.robotModel, projectStatusLabel(props.project.status), String(s.total), String(s.frames), String(s.reviews), String(s.versions)];
    const typeHeaders = Object.keys(DEFECT_TYPE_LABELS).map((k) => `${DEFECT_TYPE_LABELS[k as keyof typeof DEFECT_TYPE_LABELS]}数量`);
    const typeValues = Object.keys(DEFECT_TYPE_LABELS).map((k) => String(s.byType[k] || 0));
    const csv = generateCSV([...headers, ...typeHeaders], [[...row, ...typeValues]]);
    downloadFile(csv, `${props.project.name}_摘要.csv`, "text/csv");
    saveRecord("summary", "csv", csv);
  };

  const exportFullDefectsCSV = () => {
    const d = defects();
    const headers = ["缺陷ID", "缺陷类型", "等级", "里程(m)", "位置", "描述", "长度(mm)", "宽度(mm)", "标注人", "标注时间", "复核状态", "复核人", "复核时间", "复核意见"];
    const rows = d.map((item) => [
      item.id, DEFECT_TYPE_LABELS[item.type], SEVERITY_LABELS[item.severity], String(item.mileage),
      item.position, item.description, String(item.length), String(item.width),
      item.annotatedBy, formatDate(item.annotatedAt), REVIEW_STATUS_LABELS[item.reviewStatus],
      item.reviewedBy, formatDate(item.reviewedAt), item.reviewComment
    ]);
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `${props.project.name}_缺陷全量.csv`, "text/csv");
    saveRecord("full", "csv", csv);
  };

  const exportMileageCSV = () => {
    const d = defects().sort((a, b) => a.mileage - b.mileage);
    const headers = ["里程(m)", "缺陷类型", "等级", "位置", "描述", "复核状态"];
    const rows = d.map((item) => [
      String(item.mileage), DEFECT_TYPE_LABELS[item.type], SEVERITY_LABELS[item.severity],
      item.position, item.description, REVIEW_STATUS_LABELS[item.reviewStatus]
    ]);
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `${props.project.name}_里程表.csv`, "text/csv");
    saveRecord("mileage", "csv", csv);
  };

  const exportReviewCSV = () => {
    const r = reviews();
    const headers = ["批次名称", "复核人", "状态", "缺陷数量", "意见", "创建时间", "完成时间"];
    const rows = r.map((item) => [
      item.batchName, item.reviewer, REVIEW_STATUS_LABELS[item.status],
      String(item.defectIds.length), item.comment, formatDate(item.createdAt), formatDate(item.completedAt)
    ]);
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `${props.project.name}_复核记录.csv`, "text/csv");
    saveRecord("review", "csv", csv);
  };

  const exportJSON = () => {
    const data = {
      project: props.project,
      defects: defects(),
      frames: frames(),
      reviews: reviews(),
      versions: versions(),
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${props.project.name}_全量数据.json`, "application/json");
    saveRecord("full", "json", json);
  };

  const saveRecord = (type: string, format: string, data: string) => {
    storage.exports.create({
      id: uid(),
      projectId: props.project.id,
      exportType: type as any,
      format: format as any,
      createdAt: new Date().toISOString(),
      createdBy: "当前用户",
      recordCount: defects().length,
      data: data.slice(0, 500),
    });
    setLastExport(new Date().toLocaleTimeString("zh-CN"));
  };

  const s = summary();

  return (
    <div class="space-y-5">
      <div class="card">
        <h3 class="font-medium text-sm mb-3">数据概览</h3>
        <div class="grid grid-cols-4 gap-4">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{s.total}</div>
            <div class="text-xs text-blue-500">缺陷总数</div>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{s.frames}</div>
            <div class="text-xs text-green-500">巡检帧</div>
          </div>
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{s.reviews}</div>
            <div class="text-xs text-purple-500">复核批次</div>
          </div>
          <div class="text-center p-3 bg-amber-50 rounded-lg">
            <div class="text-2xl font-bold text-amber-600">{s.versions}</div>
            <div class="text-xs text-amber-500">版本记录</div>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-xs font-medium text-gray-500 mb-2">按类型分布</h4>
            <div class="space-y-1">
              {Object.entries(DEFECT_TYPE_LABELS).map(([k, label]) => (
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-16 text-gray-600">{label}</span>
                  <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-400 rounded-full" style={{ width: s.total ? `${((s.byType[k] || 0) / s.total) * 100}%` : "0%" }} />
                  </div>
                  <span class="w-6 text-right text-gray-500">{s.byType[k] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 class="text-xs font-medium text-gray-500 mb-2">按等级分布</h4>
            <div class="space-y-1">
              {Object.entries(SEVERITY_LABELS).map(([k, label]) => (
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-24 text-gray-600">{label}</span>
                  <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 rounded-full" style={{ width: s.total ? `${((s.bySeverity[k] || 0) / s.total) * 100}%` : "0%" }} />
                  </div>
                  <span class="w-6 text-right text-gray-500">{s.bySeverity[k] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-medium text-sm mb-3">导出操作</h3>
        <div class="grid grid-cols-2 gap-3">
          <button class="btn-primary" onClick={exportSummaryCSV}>📊 导出项目摘要 (CSV)</button>
          <button class="btn-primary" onClick={exportFullDefectsCSV}>📋 导出缺陷全量 (CSV)</button>
          <button class="btn-primary" onClick={exportMileageCSV}>📏 导出里程表 (CSV)</button>
          <button class="btn-primary" onClick={exportReviewCSV}>✅ 导出复核记录 (CSV)</button>
          <button class="btn-secondary col-span-2" onClick={exportJSON}>📦 导出全量JSON数据</button>
        </div>
        <Show when={lastExport()}>
          <p class="mt-2 text-xs text-gray-400">最近导出时间: {lastExport()}</p>
        </Show>
      </div>
    </div>
  );
}
