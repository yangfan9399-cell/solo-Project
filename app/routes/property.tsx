import { Link, useLoaderData, Form, useActionData } from "react-router";
import type { Route } from "./+types/property";
import { db } from "~/lib/db.server";
import { redirect } from "react-router";
import { AnomalyType, VisitStatus } from "@prisma/client";

export async function loader() {
  const checkedInVisits = await db.visit.findMany({
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
  });

  const anomalyVisits = checkedInVisits.filter(v => v.anomalyType !== AnomalyType.NONE);
  const overstayVisits = checkedInVisits.filter(v => v.anomalyType === AnomalyType.OVERSTAY);

  return {
    checkedInVisits,
    anomalyVisits,
    overstayVisits,
    stats: {
      total: checkedInVisits.length,
      anomaly: anomalyVisits.length,
      overstay: overstayVisits.length,
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const visitId = formData.get("visitId") as string;
  const action = formData.get("action") as string;

  const visit = await db.visit.findUnique({
    where: { id: visitId },
    include: { parkingSpot: true },
  });

  if (!visit) {
    return { error: "访问记录不存在" };
  }

  if (action === "checkOut") {
    const releaseSpot = formData.get("releaseSpot") === "on";

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
            note: releaseSpot ? "确认离场，车位已释放" : "确认离场",
          },
        },
      },
    });

    if (releaseSpot && visit.parkingSpotId) {
      await db.parkingSpot.update({
        where: { id: visit.parkingSpotId },
        data: { isAvailable: true },
      });
    }

    return redirect("/property");
  }

  if (action === "changeSpot") {
    const newSpotId = formData.get("newSpotId") as string;
    const changeNote = formData.get("changeNote") as string;

    const newSpot = await db.parkingSpot.findUnique({
      where: { id: newSpotId },
    });

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

    await db.visit.update({
      where: { id: visitId },
      data: {
        parkingSpotId: newSpotId,
        anomalyType: AnomalyType.SPOT_OCCUPIED,
        anomalyNote: changeNote,
        changeLogs: {
          create: [
            {
              fieldName: "parkingSpotId",
              oldValue: visit.parkingSpot?.spotNumber,
              newValue: newSpot?.spotNumber,
              changedBy: "李物业",
              note: changeNote || "车位被占用，协调更换车位",
            },
            {
              fieldName: "anomalyType",
              oldValue: visit.anomalyType,
              newValue: "SPOT_OCCUPIED",
              changedBy: "李物业",
              note: "记录车位被占用异常",
            },
          ],
        },
      },
    });

    return redirect("/property");
  }

  if (action === "markOverstay") {
    const overstayNote = formData.get("overstayNote") as string;

    await db.visit.update({
      where: { id: visitId },
      data: {
        anomalyType: AnomalyType.OVERSTAY,
        anomalyNote: overstayNote,
        changeLogs: {
          create: {
            fieldName: "anomalyType",
            oldValue: visit.anomalyType,
            newValue: "OVERSTAY",
            changedBy: "李物业",
            note: overstayNote || "超时未离场，发起追踪",
          },
        },
      },
    });

    return redirect("/property");
  }

  if (action === "archive") {
    await db.visit.update({
      where: { id: visitId },
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

    return redirect("/property");
  }

  return { error: "未知操作" };
}

export function meta(): Route.MetaDescriptions {
  return [{ title: "物业复核 - 物业访客车位管理平台" }];
}

export default function Property() {
  const { checkedInVisits, stats } = useLoaderData<typeof loader>();
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">在场车辆</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚗</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">异常待处理</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{stats.anomaly}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">超时追踪</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.overstay}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
          </div>
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
                {checkedInVisits.map((visit) => (
                  <div key={visit.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          visit.anomalyType !== "NONE" ? "bg-orange-100" : "bg-green-100"
                        }`}>
                          <span className="text-2xl">
                            {visit.anomalyType === "OVERSTAY" ? "⏰" :
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
                      <div className="flex gap-1">
                        {visit.anomalyType === "PLATE_MISMATCH" && (
                          <span className="badge bg-orange-100 text-orange-800">车牌不一致</span>
                        )}
                        {visit.anomalyType === "SPOT_OCCUPIED" && (
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
                            <input
                              type="text"
                              name="newSpotId"
                              placeholder="输入新村位ID"
                              className="input text-sm"
                            />
                            <textarea
                              name="changeNote"
                              placeholder="更换原因"
                              className="input text-sm"
                              rows={2}
                            />
                            <button type="submit" className="btn btn-primary btn-sm text-xs w-full">
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
                        <button type="submit" className="btn btn-warning btn-sm text-xs">
                          标记超时
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
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
