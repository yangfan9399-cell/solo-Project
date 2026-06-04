import { Link, useLoaderData, Form, useActionData } from "react-router";
import type { Route } from "./+types/visits.$id";
import { db } from "~/lib/db.server";
import { redirect } from "react-router";
import { AnomalyType, VisitStatus } from "@prisma/client";

export async function loader({ params }: Route.LoaderArgs) {
  const visit = await db.visit.findUnique({
    where: { id: params.id },
    include: {
      parkingSpot: true,
      originalSpot: true,
      changeLogs: {
        orderBy: { changedAt: "desc" },
      },
      evidences: true,
    },
  });

  if (!visit) {
    throw new Response("访问记录不存在", { status: 404 });
  }

  return { visit };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  const visit = await db.visit.findUnique({
    where: { id: params.id },
    include: { parkingSpot: true },
  });

  if (!visit) {
    return { error: "访问记录不存在" };
  }

  if (visit.isArchived) {
    return { error: "已归档记录，无法修改" };
  }

  if (action === "reprocess") {
    const newPlate = formData.get("newPlate") as string;
    const newSpotId = formData.get("newSpotId") as string;
    const reprocessNote = formData.get("reprocessNote") as string;

    const changeLogs = [];

    if (newPlate && newPlate !== visit.licensePlate) {
      changeLogs.push({
        fieldName: "licensePlate",
        oldValue: visit.licensePlate,
        newValue: newPlate,
        changedBy: "李物业",
        note: reprocessNote || "重新处理：修改车牌",
      });
    }

    if (newSpotId && newSpotId !== visit.parkingSpotId) {
      if (visit.parkingSpotId) {
        await db.parkingSpot.update({
          where: { id: visit.parkingSpotId },
          data: { isAvailable: true },
        });
      }

      await db.parkingSpot.update({
        where: { id: newSpotId },
        data: { isAvailable: false },
      });

      const newSpot = await db.parkingSpot.findUnique({
        where: { id: newSpotId },
      });

      changeLogs.push({
        fieldName: "parkingSpotId",
        oldValue: visit.parkingSpot?.spotNumber,
        newValue: newSpot?.spotNumber,
        changedBy: "李物业",
        note: reprocessNote || "重新处理：更换车位",
      });
    }

    if (changeLogs.length > 0) {
      await db.visit.update({
        where: { id: params.id },
        data: {
          licensePlate: newPlate || visit.licensePlate,
          parkingSpotId: newSpotId || visit.parkingSpotId,
          changeLogs: {
            create: changeLogs,
          },
        },
      });
    }

    return redirect(`/visits/${params.id}`);
  }

  if (action === "archive") {
    await db.visit.update({
      where: { id: params.id },
      data: {
        isArchived: true,
        status: VisitStatus.ARCHIVED,
        changeLogs: {
          create: {
            fieldName: "status",
            oldValue: visit.status,
            newValue: "ARCHIVED",
            changedBy: "李物业",
            note: "归档记录，只读",
          },
        },
      },
    });

    return redirect(`/visits/${params.id}`);
  }

  return { error: "未知操作" };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `访问详情 - ${data?.visit.visitorName || "未知"}` }];
}

export default function VisitDetail() {
  const { visit } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CHECKED_IN: "bg-green-100 text-green-800",
      CHECKED_OUT: "bg-gray-100 text-gray-800",
      ARCHIVED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "待入场",
      CHECKED_IN: "已入场",
      CHECKED_OUT: "已离场",
      ARCHIVED: "已归档",
      CANCELLED: "已取消",
    };
    return labels[status] || status;
  };

  const getAnomalyLabel = (type: string) => {
    const labels: Record<string, string> = {
      NONE: "正常",
      PLATE_MISMATCH: "车牌不一致",
      SPOT_OCCUPIED: "车位被占用",
      OVERSTAY: "超时未离场",
      OTHER: "其他异常",
    };
    return labels[type] || type;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      WECHAT: "微信预约",
      APP: "APP预约",
      PHONE: "电话预约",
      ONSITE: "现场登记",
    };
    return labels[source] || source;
  };

  const hasPlateChanged = visit.licensePlate !== visit.originalPlate;
  const hasSpotChanged = visit.parkingSpot?.id !== visit.originalSpot?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                ← 返回
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📋 访问详情</h1>
                <p className="text-sm text-gray-500">
                  {visit.visitorName} - {visit.licensePlate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${getStatusColor(visit.status)}`}>
                {getStatusLabel(visit.status)}
              </span>
              {visit.isArchived && (
                <span className="badge bg-blue-100 text-blue-800">只读</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionData?.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{actionData.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">访客信息</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">访客姓名</p>
                    <p className="font-medium">{visit.visitorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">联系电话</p>
                    <p className="font-medium">{visit.visitorPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">所属单位</p>
                    <p className="font-medium">{visit.visitorCompany || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">访问事由</p>
                    <p className="font-medium">{visit.purpose}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">车辆信息</h2>
                {hasPlateChanged && (
                  <span className="badge bg-orange-100 text-orange-800">车牌已变更</span>
                )}
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">当前车牌</p>
                    <p className="font-mono font-bold text-lg">{visit.licensePlate}</p>
                  </div>
                  {hasPlateChanged && (
                    <div>
                      <p className="text-sm text-gray-500">原预约车牌</p>
                      <p className="font-mono text-gray-400 line-through">{visit.originalPlate}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">车位信息</h2>
                {hasSpotChanged && (
                  <span className="badge bg-purple-100 text-purple-800">车位已变更</span>
                )}
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">当前车位</p>
                    <p className="font-bold text-lg">
                      {visit.parkingSpot?.spotNumber || "未分配"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {visit.parkingSpot ? `${visit.parkingSpot.floor} ${visit.parkingSpot.zone}` : "-"}
                    </p>
                  </div>
                  {hasSpotChanged && visit.originalSpot && (
                    <div>
                      <p className="text-sm text-gray-500">原预约车位</p>
                      <p className="text-gray-400 line-through">{visit.originalSpot.spotNumber}</p>
                      <p className="text-sm text-gray-400">
                        {visit.originalSpot.floor} {visit.originalSpot.zone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">访问时间</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">预约日期</p>
                    <p className="font-medium">
                      {new Date(visit.visitDate).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">预约来源</p>
                    <p className="font-medium">{getSourceLabel(visit.source)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">预约开始</p>
                    <p className="font-medium">
                      {new Date(visit.startTime).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">预约结束</p>
                    <p className="font-medium">
                      {new Date(visit.endTime).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">实际入场</p>
                    <p className="font-medium text-green-600">
                      {visit.actualCheckIn
                        ? new Date(visit.actualCheckIn).toLocaleString("zh-CN")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">实际离场</p>
                    <p className="font-medium text-gray-600">
                      {visit.actualCheckOut
                        ? new Date(visit.actualCheckOut).toLocaleString("zh-CN")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">被访人信息</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">被访人姓名</p>
                    <p className="font-medium">{visit.hostName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">联系电话</p>
                    <p className="font-medium">{visit.hostPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">所属部门</p>
                    <p className="font-medium">{visit.hostDepartment || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {visit.anomalyType !== "NONE" && (
              <div className="card border-orange-300">
                <div className="card-header bg-orange-50">
                  <h2 className="text-lg font-semibold text-orange-900">
                    ⚠️ 异常记录
                  </h2>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-orange-100 text-orange-800">
                      {getAnomalyLabel(visit.anomalyType)}
                    </span>
                  </div>
                  {visit.anomalyNote && (
                    <p className="text-gray-700">{visit.anomalyNote}</p>
                  )}
                </div>
              </div>
            )}

            {visit.evidences.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">📷 放行证据</h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-4">
                    {visit.evidences.map((evidence) => (
                      <div key={evidence.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{evidence.type}</p>
                        <p className="text-xs text-gray-500">{evidence.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(evidence.capturedAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">⚡ 快捷操作</h2>
              </div>
              <div className="card-body space-y-3">
                {!visit.isArchived ? (
                  <>
                    <details className="w-full">
                      <summary className="cursor-pointer p-3 bg-gray-50 rounded text-sm font-medium hover:bg-gray-100">
                        重新处理（修改车牌/车位）
                      </summary>
                      <Form method="post" className="mt-3 space-y-3">
                        <input type="hidden" name="action" value="reprocess" />
                        <div>
                          <label className="label text-xs">新车牌</label>
                          <input
                            type="text"
                            name="newPlate"
                            defaultValue={visit.licensePlate}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">新车位ID</label>
                          <input
                            type="text"
                            name="newSpotId"
                            defaultValue={visit.parkingSpotId || ""}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">处理备注</label>
                          <textarea
                            name="reprocessNote"
                            className="input text-sm"
                            rows={2}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary w-full text-sm">
                          确认修改
                        </button>
                      </Form>
                    </details>

                    <Form method="post">
                      <input type="hidden" name="action" value="archive" />
                      <button
                        type="submit"
                        className="btn btn-secondary w-full text-sm"
                      >
                        📦 归档记录
                      </button>
                    </Form>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">已归档，只读</p>
                    <p className="text-xs text-gray-400 mt-1">如需修改请先取消归档</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">📝 变更历史</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {visit.changeLogs.map((log, index) => (
                    <div key={log.id} className="relative">
                      {index < visit.changeLogs.length - 1 && (
                        <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200" />
                      )}
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center z-10">
                          <span className="text-xs">✓</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {log.fieldName === "status" ? "状态变更" :
                               log.fieldName === "licensePlate" ? "车牌变更" :
                               log.fieldName === "parkingSpotId" ? "车位变更" :
                               log.fieldName === "anomalyType" ? "异常标记" : log.fieldName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.changedAt).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          {(log.oldValue || log.newValue) && (
                            <div className="text-sm mt-1">
                              {log.oldValue && (
                                <span className="text-gray-400 line-through mr-2">
                                  {log.oldValue}
                                </span>
                              )}
                              {log.newValue && (
                                <span className="text-green-600 font-medium">
                                  → {log.newValue}
                                </span>
                              )}
                            </div>
                          )}
                          {log.note && (
                            <p className="text-sm text-gray-600 mt-1">{log.note}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">操作人：{log.changedBy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
