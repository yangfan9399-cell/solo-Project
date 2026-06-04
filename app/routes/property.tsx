import { Link, useLoaderData, Form, useActionData } from "react-router";
import type { Route } from "./+types/property";
import { db } from "~/lib/db.server";
import { redirect } from "react-router";
import { AnomalyType, VisitStatus } from "@prisma/client";
import {
  getAvailableSpots,
  validateSpotAvailable,
  releaseSpot,
  occupySpot,
  buildAnomalyNote,
} from "~/lib/parkingSpot";

export async function loader() {
  const [checkedInVisits, availableSpots] = await Promise.all([
    db.visit.findMany({
      where: {
        status: VisitStatus.CHECKED_IN,
        isArchived: false,
      },
      include: {
        parkingSpot: true,
        originalSpot: true,
        changeLogs: {
          orderBy: { changedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { actualCheckIn: "desc" },
    }),
    getAvailableSpots(),
  ]);

  const anomalyVisits = checkedInVisits.filter(v => v.anomalyType !== AnomalyType.NONE);
  const overstayVisits = checkedInVisits.filter(v => v.anomalyType === AnomalyType.OVERSTAY);

  const stats = {
    total: checkedInVisits.length,
    anomaly: anomalyVisits.length,
    overstay: overstayVisits.length,
    plateMismatch: checkedInVisits.filter(v => v.anomalyType === AnomalyType.PLATE_MISMATCH).length,
    spotOccupied: checkedInVisits.filter(v => v.anomalyType === AnomalyType.SPOT_OCCUPIED).length,
    bothChange: checkedInVisits.filter(v => {
      const plateChanged = v.licensePlate !== v.originalPlate;
      const spotChanged = v.parkingSpotId !== v.originalSpotId;
      return plateChanged && spotChanged;
    }).length,
  };

  return {
    checkedInVisits,
    availableSpots,
    anomalyVisits,
    overstayVisits,
    stats,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const visitId = formData.get("visitId") as string;
  const action = formData.get("action") as string;

  const visit = await db.visit.findUnique({
    where: { id: visitId },
    include: { parkingSpot: true, originalSpot: true },
  });

  if (!visit) {
    return { error: "访问记录不存在", visitId };
  }

  if (visit.isArchived) {
    return { error: "已归档记录，无法修改", visitId };
  }

  if (action === "checkOut") {
    const releaseSpotFlag = formData.get("releaseSpot") === "on";

    await db.visit.update({
      where: { id: visitId },
      data: {
        actualCheckOut: new Date(),
        status: VisitStatus.CHECKED_OUT,
        changeLogs: {
          create: {
            fieldName: "status",
            oldValue: "CHECKED_IN",
            newValue: "CHECKED_OUT",
            changedBy: "李物业",
            note: releaseSpotFlag ? "确认离场，车位已释放" : "确认离场",
          },
        },
      },
    });

    if (releaseSpotFlag && visit.parkingSpotId) {
      await releaseSpot(visit.parkingSpotId);
    }

    return redirect("/property");
  }

  if (action === "changeSpot") {
    const newSpotId = formData.get("newSpotId") as string;
    const changeNote = formData.get("changeNote") as string;

    if (!newSpotId) {
      return { error: "请选择新车位", visitId };
    }

    if (newSpotId === visit.parkingSpotId) {
      return { error: "新车位与当前车位相同", visitId };
    }

    const spotValidation = await validateSpotAvailable(newSpotId, visitId);
    if (!spotValidation.valid) {
      return { error: spotValidation.error, visitId };
    }

    const oldSpotNumber = visit.parkingSpot?.spotNumber || "未分配";
    const newSpotNumber = spotValidation.spot.spotNumber;

    const changeLogs = [];
    const plateChanged = visit.licensePlate !== visit.originalPlate;

    if (visit.parkingSpotId) {
      await releaseSpot(visit.parkingSpotId);
    }

    await occupySpot(newSpotId);

    changeLogs.push({
      fieldName: "parkingSpotId",
      oldValue: oldSpotNumber,
      newValue: newSpotNumber,
      changedBy: "李物业",
      note: changeNote || `原车位${oldSpotNumber}被占用，协调更换为${newSpotNumber}`,
    });

    let anomalyType = visit.anomalyType;
    let anomalyNote = visit.anomalyNote;

    if (plateChanged && visit.anomalyType === AnomalyType.PLATE_MISMATCH) {
      anomalyType = AnomalyType.SPOT_OCCUPIED;
      anomalyNote = buildAnomalyNote(
        "BOTH",
        visit.originalPlate,
        visit.licensePlate,
        oldSpotNumber,
        newSpotNumber,
        changeNote
      );

      changeLogs.push({
        fieldName: "anomalyType",
        oldValue: "PLATE_MISMATCH",
        newValue: "SPOT_OCCUPIED",
        changedBy: "李物业",
        note: "同时存在车牌和车位变更，更新异常类型",
      });
    } else if (visit.anomalyType !== AnomalyType.SPOT_OCCUPIED && visit.anomalyType !== AnomalyType.OVERSTAY) {
      anomalyType = AnomalyType.SPOT_OCCUPIED;
      anomalyNote = buildAnomalyNote(
        "SPOT_OCCUPIED",
        undefined,
        undefined,
        oldSpotNumber,
        newSpotNumber,
        changeNote
      );

      changeLogs.push({
        fieldName: "anomalyType",
        oldValue: visit.anomalyType,
        newValue: "SPOT_OCCUPIED",
        changedBy: "李物业",
        note: "记录车位被占用异常",
      });
    }

    await db.visit.update({
      where: { id: visitId },
      data: {
        parkingSpotId: newSpotId,
        anomalyType,
        anomalyNote,
        changeLogs: {
          create: changeLogs,
        },
      },
    });

    return redirect("/property");
  }

  if (action === "markOverstay") {
    const overstayNote = formData.get("overstayNote") as string;

    const changeLogs = [];

    if (visit.anomalyType !== AnomalyType.OVERSTAY) {
      const plateChanged = visit.licensePlate !== visit.originalPlate;
      const spotChanged = visit.parkingSpotId !== visit.originalSpotId;

      let note = overstayNote || "超时未离场，发起追踪";
      if (plateChanged || spotChanged) {
        const parts = [];
        if (plateChanged) parts.push(`车牌: ${visit.originalPlate}→${visit.licensePlate}`);
        if (spotChanged) parts.push(`车位: ${visit.originalSpot?.spotNumber || "未分配"}→${visit.parkingSpot?.spotNumber || "未分配"}`);
        note = `${overstayNote || "超时未离场"}，同时存在${parts.join(", ")}变更`;
      }

      changeLogs.push({
        fieldName: "anomalyType",
        oldValue: visit.anomalyType,
        newValue: "OVERSTAY",
        changedBy: "李物业",
        note,
      });
    }

    await db.visit.update({
      where: { id: visitId },
      data: {
        anomalyType: AnomalyType.OVERSTAY,
        anomalyNote: overstayNote || "超时未离场，需要追踪确认",
        ...(changeLogs.length > 0 ? {
          changeLogs: {
            create: changeLogs,
          },
        } : {}),
      },
    });

    return redirect("/property");
  }

  return { error: "未知操作", visitId };
}

export function meta(): Route.MetaDescriptions {
  return [{ title: "物业复核 - 物业访客车位管理平台" }];
}

export default function Property() {
  const { checkedInVisits, availableSpots, stats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              ← 返回首页
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">🔍 物业复核台</h1>
              <p className="text-sm text-gray-500">离场确认、车位释放与异常追踪</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionData?.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{actionData.error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-green-600">{stats.total}</p>
              <p className="text-xs text-gray-500">在场车辆</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.anomaly}</p>
              <p className="text-xs text-gray-500">异常待处理</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overstay}</p>
              <p className="text-xs text-gray-500">超时追踪</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.plateMismatch}</p>
              <p className="text-xs text-gray-500">车牌不符</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.spotOccupied}</p>
              <p className="text-xs text-gray-500">车位占用</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.bothChange}</p>
              <p className="text-xs text-gray-500">双变更</p>
            </div>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <span className="font-medium">💡 提示：</span>
          当前可用车位 {availableSpots.length} 个
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">在场车辆列表</h2>
          </div>
          <div className="card-body">
            {checkedInVisits.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无在场车辆</p>
            ) : (
              <div className="space-y-4">
                {checkedInVisits.map((visit) => {
                  const plateChanged = visit.licensePlate !== visit.originalPlate;
                  const spotChanged = visit.parkingSpotId !== visit.originalSpotId;
                  const hasBothChange = plateChanged && spotChanged;

                  return (
                    <div key={visit.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            visit.anomalyType !== "NONE" ? "bg-orange-100" : "bg-green-100"
                          }`}>
                            <span className="text-2xl">
                              {visit.anomalyType === "OVERSTAY" ? "⏰" :
                               hasBothChange ? "🔄" :
                               visit.anomalyType === "PLATE_MISMATCH" ? "🔢" :
                               visit.anomalyType === "SPOT_OCCUPIED" ? "🅿️" : "✅"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{visit.visitorName}</p>
                            <p className="text-sm text-gray-500">
                              {visit.licensePlate} | {visit.parkingSpot?.spotNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {hasBothChange && (
                            <span className="badge bg-indigo-100 text-indigo-800">双变更</span>
                          )}
                          {visit.anomalyType === "PLATE_MISMATCH" && !hasBothChange && (
                            <span className="badge bg-orange-100 text-orange-800">车牌不一致</span>
                          )}
                          {visit.anomalyType === "SPOT_OCCUPIED" && !hasBothChange && (
                            <span className="badge bg-purple-100 text-purple-800">车位占用</span>
                          )}
                          {visit.anomalyType === "OVERSTAY" && (
                            <span className="badge bg-red-100 text-red-800">超时</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">入场时间：</span>
                          <span>
                            {visit.actualCheckIn
                              ? new Date(visit.actualCheckIn).toLocaleString("zh-CN", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">预约离场：</span>
                          <span>
                            {new Date(visit.endTime).toLocaleTimeString("zh-CN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">被访人：</span>
                          <span>{visit.hostName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">访问事由：</span>
                          <span>{visit.purpose}</span>
                        </div>
                      </div>

                      {(plateChanged || spotChanged) && (
                        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                          {plateChanged && (
                            <div className="mb-1">
                              <span className="text-gray-500">车牌变更：</span>
                              <span className="text-orange-600">
                                <span className="line-through">{visit.originalPlate}</span>
                                {" → "}
                                <span className="font-medium">{visit.licensePlate}</span>
                              </span>
                            </div>
                          )}
                          {spotChanged && visit.originalSpot && (
                            <div>
                              <span className="text-gray-500">车位变更：</span>
                              <span className="text-purple-600">
                                <span className="line-through">{visit.originalSpot.spotNumber}</span>
                                {" → "}
                                <span className="font-medium">{visit.parkingSpot?.spotNumber}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {visit.anomalyNote && (
                        <div className="mb-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                          <span className="font-medium">异常备注：</span>{visit.anomalyNote}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Form method="post" className="inline">
                          <input type="hidden" name="visitId" value={visit.id} />
                          <input type="hidden" name="action" value="checkOut" />
                          <div className="flex items-center gap-2">
                            <button type="submit" className="btn btn-success btn-sm text-xs">
                              确认离场
                            </button>
                            <label className="flex items-center gap-1 text-xs text-gray-600">
                              <input type="checkbox" name="releaseSpot" defaultChecked />
                              释放车位
                            </label>
                          </div>
                        </Form>

                        <details className="inline">
                          <summary className="btn btn-secondary btn-sm text-xs cursor-pointer">
                            更换车位
                          </summary>
                          <Form method="post" className="mt-2 p-3 bg-gray-50 rounded">
                            <input type="hidden" name="visitId" value={visit.id} />
                            <input type="hidden" name="action" value="changeSpot" />
                            <div className="space-y-2">
                              <div>
                                <label className="label text-xs">选择新车位</label>
                                <select name="newSpotId" className="input text-sm" required>
                                  <option value="">请选择可用车位</option>
                                  <option value={visit.parkingSpotId || ""} disabled>
                                    {visit.parkingSpot?.spotNumber || "未分配"}（当前）
                                  </option>
                                  <option disabled>--- 可用车位 ---</option>
                                  {availableSpots.map((spot) => (
                                    <option key={spot.id} value={spot.id}>
                                      {spot.spotNumber} - {spot.floor} {spot.zone}
                                    </option>
                                  ))}
                                </select>
                                {availableSpots.length === 0 && (
                                  <p className="text-xs text-orange-600 mt-1">⚠️ 暂无其他可用车位</p>
                                )}
                              </div>
                              <div>
                                <label className="label text-xs">更换原因（必填）</label>
                                <textarea
                                  name="changeNote"
                                  placeholder="请说明更换车位的原因"
                                  className="input text-sm"
                                  rows={2}
                                  required
                                />
                              </div>
                              <button 
                                type="submit" 
                                className="btn btn-primary btn-sm text-xs w-full"
                                disabled={availableSpots.length === 0}
                              >
                                确认更换
                              </button>
                            </div>
                          </Form>
                        </details>

                        <Form method="post" className="inline">
                          <input type="hidden" name="visitId" value={visit.id} />
                          <input type="hidden" name="action" value="markOverstay" />
                          <input
                            type="hidden"
                            name="overstayNote"
                            value="超时未离场，需要追踪确认"
                          />
                          <button 
                            type="submit" 
                            className="btn btn-warning btn-sm text-xs"
                            disabled={visit.anomalyType === "OVERSTAY"}
                          >
                            {visit.anomalyType === "OVERSTAY" ? "已标记超时" : "标记超时"}
                          </button>
                        </Form>

                        <Link
                          to={`/visits/${visit.id}`}
                          className="btn btn-secondary btn-sm text-xs"
                        >
                          查看详情
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
