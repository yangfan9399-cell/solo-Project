import { getProjectById, getProjectStats } from './projects';
import { getAllUnits } from './units';
import { getRelationsByProject } from './relations';
import { listArtifacts } from './artifacts';
import { getPhotosByProject } from './photos';
import { detectAnomalies } from './anomalies';
import type { ExportSummary } from '../types';

export function generateExportSummary(projectId: string): ExportSummary {
  const project = getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  
  const stats = getProjectStats(projectId);
  const units = getAllUnits(projectId);
  const artifacts = listArtifacts(projectId, { page: 1, pageSize: 100 });
  const anomalies = detectAnomalies(projectId);
  
  const maxDepth = units.length > 0 ? Math.max(...units.map(u => u.depthBottom)) : 0;
  
  const keyFindings: string[] = [];
  if (stats.featureCount > 0) {
    keyFindings.push(`发现 ${stats.featureCount} 处遗迹现象`);
  }
  if (stats.artifactCount > 0) {
    keyFindings.push(`出土器物 ${stats.artifactCount} 件/组`);
  }
  if (maxDepth > 0) {
    keyFindings.push(`发掘深度达 ${maxDepth.toFixed(2)} 米`);
  }
  if (units.length > 0) {
    const periods = [...new Set(units.map(u => u.designation).filter(Boolean))];
    if (periods.length > 0) {
      keyFindings.push(`涉及 ${periods.length} 个文化层位`);
    }
  }
  
  const excavatedUnits = units.filter(u => u.excavationDate);
  const progress = units.length > 0 ? `${excavatedUnits.length}/${units.length} 层已发掘` : '未开始';
  
  return {
    project,
    unitCount: stats.unitCount,
    artifactCount: stats.artifactCount,
    photoCount: String(stats.photoCount),
    relationCount: stats.relationCount,
    periodCoverage: units.length > 0 ? `从地表到 ${maxDepth.toFixed(2)}m 深度` : '暂无数据',
    excavationProgress: progress,
    keyFindings,
    anomalies: anomalies.slice(0, 10),
    exportDate: new Date().toISOString()
  };
}

export function exportToJSON(projectId: string): string {
  const project = getProjectById(projectId);
  const units = getAllUnits(projectId);
  const relations = getRelationsByProject(projectId);
  const artifacts = listArtifacts(projectId, { page: 1, pageSize: 1000 });
  const photos = getPhotosByProject(projectId);
  const summary = generateExportSummary(projectId);
  
  return JSON.stringify({
    summary,
    project,
    units,
    relations,
    artifacts: artifacts.items,
    photos,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

export function generateMarkdownReport(projectId: string): string {
  const summary = generateExportSummary(projectId);
  const units = getAllUnits(projectId);
  const { project } = summary;
  
  let md = `# ${project.name} 考古发掘报告摘要\n\n`;
  md += `**项目编号**: ${project.code}\n\n`;
  md += `**发掘地点**: ${project.location || '未知'}\n\n`;
  md += `**项目负责人**: ${project.director || '未知'}\n\n`;
  md += `**发掘时间**: ${project.startDate || '未开始'} - ${project.endDate || '进行中'}\n\n`;
  md += `**导出日期**: ${new Date(summary.exportDate).toLocaleDateString('zh-CN')}\n\n`;
  
  md += `---\n\n`;
  md += `## 一、基本统计\n\n`;
  md += `- 层位总数: ${summary.unitCount} 个\n`;
  md += `- 出土物总数: ${summary.artifactCount} 件/组\n`;
  md += `- 照片总数: ${summary.photoCount} 张\n`;
  md += `- 层位关系: ${summary.relationCount} 条\n`;
  md += `- 发掘进度: ${summary.excavationProgress}\n`;
  md += `- 覆盖深度: ${summary.periodCoverage}\n\n`;
  
  md += `## 二、主要发现\n\n`;
  summary.keyFindings.forEach((finding, i) => {
    md += `${i + 1}. ${finding}\n`;
  });
  md += `\n`;
  
  md += `## 三、地层序列\n\n`;
  md += `| 层位号 | 类型 | 名称 | 深度范围 | 厚度 |\n`;
  md += `|--------|------|------|----------|------|\n`;
  
  units
    .sort((a, b) => a.depthTop - b.depthTop)
    .forEach(unit => {
      const typeMap: Record<string, string> = {
        'layer': '地层',
        'feature': '遗迹',
        'disturbance': '扰动'
      };
      md += `| ${unit.unitNumber} | ${typeMap[unit.type] || unit.type} | ${unit.designation || '-'} | ${unit.depthTop}-${unit.depthBottom}m | ${unit.thickness}m |\n`;
    });
  
  md += `\n`;
  
  if (summary.anomalies.length > 0) {
    md += `## 四、数据异常提示\n\n`;
    summary.anomalies.forEach(a => {
      const severityMap: Record<string, string> = {
        'error': '🔴 错误',
        'warning': '🟡 警告',
        'info': '🔵 提示'
      };
      md += `- ${severityMap[a.severity]}: ${a.title}\n`;
      md += `  ${a.description}\n`;
    });
    md += `\n`;
  }
  
  md += `---\n\n`;
  md += `> 本报告由考古探方出土层位关系编辑器自动生成\n`;
  
  return md;
}
