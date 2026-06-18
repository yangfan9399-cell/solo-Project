import { BowArchive, AnomalyAlert } from "./types";

interface RangeRule {
  min?: number;
  max?: number;
  severity: "low" | "medium" | "high";
  message: string;
}

interface ValidationRules {
  [key: string]: RangeRule;
}

const RECURVE_RULES: ValidationRules = {
  bowLength: { min: 66, max: 72, severity: "medium", message: "弓长应在66-72英寸之间" },
  drawWeight: { min: 16, max: 50, severity: "high", message: "拉力异常，超出常规竞技范围" },
  braceHeight: { min: 7.5, max: 9.75, severity: "medium", message: "弦距（Brace Height）应在7.5-9.75英寸之间" },
  arrowWeight: { min: 200, max: 600, severity: "medium", message: "箭重超出常规范围（200-600格令）" },
  nockingPoint: { min: 0.25, max: 0.75, severity: "low", message: "搭箭点位置偏离常规区间" },
  tillerTop: { min: 0, max: 0.5, severity: "low", message: "上弓梢梢差偏大" },
  tillerBottom: { min: 0, max: 0.5, severity: "low", message: "下弓梢梢差偏大" },
  stringStrands: { min: 12, max: 18, severity: "low", message: "弦股数超出常规范围（12-18股）" },
  centerShot: { min: 11, max: 19, severity: "medium", message: "中心射偏移量异常" },
  plungerTension: { min: 1, max: 7, severity: "low", message: "箭台弹簧张力应在1-7档" },
};

const TRADITIONAL_RULES: ValidationRules = {
  bowLength: { min: 48, max: 72, severity: "medium", message: "传统弓弓长异常" },
  drawWeight: { min: 15, max: 80, severity: "high", message: "拉力超出传统弓常规范围" },
  braceHeight: { min: 5, max: 9, severity: "medium", message: "弦距异常" },
  arrowWeight: { min: 300, max: 1200, severity: "low", message: "箭重超出传统箭常规范围" },
  stringStrands: { min: 8, max: 24, severity: "low", message: "弦股数异常" },
};

export function detectAnomalies(archive: BowArchive): Omit<AnomalyAlert, "id" | "archiveId" | "detectedAt">[] {
  const alerts: Omit<AnomalyAlert, "id" | "archiveId" | "detectedAt">[] = [];
  const rules = archive.bowType.toLowerCase().includes("traditional") || archive.bowType.includes("传统")
    ? TRADITIONAL_RULES
    : RECURVE_RULES;

  for (const [field, rule] of Object.entries(rules)) {
    const value = (archive as any)[field];
    if (typeof value !== "number" || isNaN(value)) continue;
    if (rule.min !== undefined && value < rule.min) {
      alerts.push({
        field,
        value,
        expectedMin: rule.min,
        expectedMax: rule.max,
        severity: rule.severity,
        message: `${rule.message}（当前值偏低：${value}）`,
      });
    } else if (rule.max !== undefined && value > rule.max) {
      alerts.push({
        field,
        value,
        expectedMin: rule.min,
        expectedMax: rule.max,
        severity: rule.severity,
        message: `${rule.message}（当前值偏高：${value}）`,
      });
    }
  }

  const upper = Number(archive.upperTipWeight ?? 0);
  const lower = Number(archive.lowerTipWeight ?? 0);
  const tipDiff = Math.abs(upper - lower);
  if (upper > 0 && lower > 0 && tipDiff > 0.25) {
    alerts.push({
      field: "tipWeight",
      value: tipDiff,
      expectedMax: 0.25,
      severity: tipDiff > 0.5 ? "high" : "medium",
      message: `上下弓梢重量差过大（${tipDiff.toFixed(2)} oz），可能导致发射不稳`,
    });
  }

  if (archive.arrowWeight > 0 && archive.drawWeight > 0) {
    const gpp = archive.arrowWeight / archive.drawWeight;
    if (gpp < 5) {
      alerts.push({
        field: "gpp",
        value: gpp,
        expectedMin: 5,
        severity: "high",
        message: `箭重/拉力比（${gpp.toFixed(2)} gr/lb）过低，存在空放风险！`,
      });
    } else if (gpp > 14) {
      alerts.push({
        field: "gpp",
        value: gpp,
        expectedMax: 14,
        severity: "low",
        message: `箭重/拉力比（${gpp.toFixed(2)} gr/lb）偏高，箭速会较慢`,
      });
    }
  }

  return alerts;
}
