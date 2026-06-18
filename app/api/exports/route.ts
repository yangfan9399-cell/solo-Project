import { NextRequest, NextResponse } from "next/server";
import { exportsRepo, archivesRepo, pointsRepo, versionsRepo } from "@/lib/repo";
import { initSchema } from "@/lib/db";
import type { BowArchive, TargetPoint, BowVersion } from "@/lib/types";

function buildTextSummary(archive: BowArchive, points: TargetPoint[], versions: BowVersion[]): string {
  const avg =
    points.length > 0
      ? (points.reduce((s, p) => s + p.score, 0) / points.length).toFixed(2)
      : "N/A";
  return `传统弓箭调弓参数档案 — ${archive.name}
================================
基础信息
  档案编号：${archive.id.slice(0, 8)}
  弓型：${archive.bowType}
  弓长：${archive.bowLength} inch
  状态：${archive.status}
  更新时间：${archive.updatedAt}

弓体参数
  额定拉力：${archive.drawWeight} lbs @ ${archive.drawLength} inch
  弦距（ Brace Height ）：${archive.braceHeight} inch
  上弓梢：${archive.upperTipWeight ?? "-"} oz；下弓梢：${archive.lowerTipWeight ?? "-"} oz
  弓片弹力比：${archive.limbRatio ?? "-"}

箭与弓弦
  箭重：${archive.arrowWeight} grain
  箭杆挠度（ Spine ）：${archive.arrowSpine ?? "-"}
  弦股数：${archive.stringStrands ?? "-"}；弦材质：${archive.stringMaterial ?? "-"}
  GPP（箭重/拉力）：${(Number(archive.arrowWeight) / Number(archive.drawWeight)).toFixed(2)}

撒放与瞄准
  撒放方式：${archive.releaseType}
  箭台：${archive.restType ?? "-"}；瞄准器：${archive.sightType ?? "-"}

靶纸统计
  记录箭数：${points.length}
  累计环数：${points.reduce((s, p) => s + p.score, 0)}
  平均环值：${avg}

版本批次
  快照版本数：${versions.length}
  最新批次：${versions[0]?.batchCode ?? "暂无"}

备注：${archive.notes ?? "—"}
`;
}

export async function GET() {
  await initSchema();
  return NextResponse.json(exportsRepo.list());
}

export async function POST(req: NextRequest) {
  await initSchema();
  const body = await req.json();
  const archiveId: string = body.archiveId;
  const format: "text" | "json" = body.format || "text";
  const archive = archivesRepo.get(archiveId);
  if (!archive) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const points = pointsRepo.listByArchive(archiveId);
  const versions = versionsRepo.listByArchive(archiveId);

  let content: string;
  if (format === "json") {
    content = JSON.stringify({ archive, points, versions }, null, 2);
  } else {
    content = buildTextSummary(archive, points, versions);
  }
  const created = exportsRepo.create({
    archiveId,
    format,
    archiveName: archive.name,
    content,
  });
  return NextResponse.json(created, { status: 201 });
}
