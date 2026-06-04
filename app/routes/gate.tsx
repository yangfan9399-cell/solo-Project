import { Link, useLoaderData, Form, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/gate";
import { db } from "~/lib/db.server";
import { redirect } from "react-router";
import { AnomalyType, VisitStatus } from "@prisma/client";

export async function loader() {
  const pendingVisits = await db.visit.findMany({
    where: {
      status: VisitStatus.PENDING,
      isArchived: false,
    },
    include: {
      parkingSpot: true,
      originalSpot: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const todayCheckedIn = await db.visit.findMany({
    where: {
      status: VisitStatus.CHECKED_IN,
      isArchived: false,
    },
    include: {
      parkingSpot: true,
    },
    orderBy: { actualCheckIn: "desc" },
  });

  return { pendingVisits, todayCheckedIn };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const visitId = formData.get("visitId") as string;
  const action = formData.get("action") as string;

  if (action === "checkIn") {
    const actualPlate = formData.get("actualPlate") as string;
    const anomalyNote = formData.get("anomalyNote") as string;
    const hasAnomaly = formData.get("hasAnomaly") === "on";

    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: { parkingSpot: true },
    });

    if (!visit) {
      return { error: "访问记录不存在" };
    }

    const plateMismatch = hasAnomaly && actualPlate && actualPlate !== visit.licensePlate;

    await db.visit.update({
      where: { id: visitId },
      data: {
        licensePlate: plateMismatch ? actualPlate : visit.licensePlate,
        actualCheckIn: new Date(),
        status: VisitStatus.CHECKED_IN,
        anomalyType: plateMismatch ? AnomalyType.PLATE_MISMATCH : AnomalyType.NONE,
        anomalyNote: plateMismatch ? anomalyNote : null,
        changeLogs: {
          create: [
            ...(plateMismatch ? [{
              fieldName: "licensePlate",
              oldValue: visit.licensePlate,
              newValue: actualPlate,
              changedBy: "张保安",
              note: anomalyNote || "车牌不一致，已核实修改",
            }] : []),
            {
              fieldName: "status",
              oldValue: "PENDING",
              newValue: "CHECKED_IN",
              changedBy: "张保安",
              note: plateMismatch ? "异常后确认入场" : "门岗确认入场",
            },
          ],
        },
        evidences: hasAnomaly ? {
          create: {
            type: "PLATE_PHOTO",
            description: "入场核验照片",
            capturedBy: "guard1",
          },
        } : undefined,
      },
    });

    return redirect("/gate");
  }

  if (action === "noteAnomaly") {
    const anomalyType = formData.get("anomalyType") as string;
    const anomalyNote = formData.get("anomalyNote") as string;

    await db.visit.update({
      where: { id: visitId },
      data: {
        anomalyType: anomalyType as AnomalyType,
        anomalyNote,
        changeLogs: {
          create: {
            fieldName: "anomalyType",
            oldValue: "NONE",
            newValue: anomalyType,
            changedBy: "张保安",
            note: anomalyNote,
          },
        },
      },
    });

    return redirect("/gate");
  }

  return { error: "未知操作" };
}

export function meta(): Route.MetaDescriptions {
  return [{ title: "门岗放行 - 物业访客车位管理平台" }];
}

export default function Gate() {
  const { pendingVisits, todayCheckedIn } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              ← 返回首页
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">🚪 门岗放行台</h1>
              <p className="text-sm text-gray-500">访客车辆入场核验与异常处理</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                待入场车辆 ({pendingVisits.length})
              </h2>
            </div>
            <div className="card-body">
              {pendingVisits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无待入场车辆</p>
              ) : (
                <div className="space-y-4">
                  {pendingVisits.map((visit) => (
                    <div key={visit.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🚗</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{visit.visitorName}</p>
                            <p className="text-sm text-gray-500">{visit.visitorPhone}</p>
                          </div>
                        </div>
                        <span className="badge bg-yellow-100 text-yellow-800">待入场</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">车牌：</span>
                          <span className="font-mono font-medium">{visit.licensePlate}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">车位：</span>
                          <span className="font-medium">{visit.parkingSpot?.spotNumber || "未分配"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">被访人：</span>
                          <span>{visit.hostName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">预约时间：</span>
                          <span>{new Date(visit.startTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>

                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                          展开核验
                        </summary>
                        <Form method="post" className="mt-3 space-y-3">
                          <input type="hidden" name="visitId" value={visit.id} />
                          <input type="hidden" name="action" value="checkIn" />

                          <div>
                            <label className="label">实际车牌</label>
                            <input
                              type="text"
                              name="actualPlate"
                              defaultValue={visit.licensePlate}
                              className="input"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`anomaly-${visit.id}`}
                              name="hasAnomaly"
                              className="w-4 h-4 text-blue-600"
                            />
                            <label htmlFor={`anomaly-${visit.id}`} className="text-sm text-gray-700">
                              存在异常（车牌不一致等）
                            </label>
                          </div>

                          <div>
                            <label className="label">异常备注</label>
                            <textarea
                              name="anomalyNote"
                              className="input"
                              rows={2}
                              placeholder="如有异常请备注"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit" className="btn btn-success w-full">
                              确认放行
                            </button>
                          </div>
                        </Form>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>

          <div>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                今日已入场 ({todayCheckedIn.length})
              </h2>
            </div>
            <div className="card-body">
              {todayCheckedIn.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无已入场车辆</p>
              ) : (
                  <div className="space-y-3">
                    {todayCheckedIn.map((visit) => (
                    <Link
                      key={visit.id}
                      to={`/visits/${visit.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">✅</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{visit.visitorName}</p>
                          <p className="text-sm text-gray-500">{visit.licensePlate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-1 justify-end">
                          <span className="badge bg-green-100 text-green-800">已入场</span>
                          {visit.anomalyType !== "NONE" && (
                            <span className="badge bg-orange-100 text-orange-800">异常</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          入场: {visit.actualCheckIn ? new Date(visit.actualCheckIn).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
