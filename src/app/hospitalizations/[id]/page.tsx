import { notFound } from "next/navigation";
import Link from "next/link";
import { getHospitalizationById, getStaffById } from "../../../lib/api";
import {
  HospitalizationStatusBadge,
  OrderStatusBadge,
  FeeStatusBadge,
  AnomalyBadge,
  NursingTypeBadge,
} from "../../../components/StatusBadge";
import { formatDate, formatDateTime, formatCurrency, calculateStayDays } from "../../../lib/utils";

export const dynamic = "force-dynamic";

export default async function HospitalizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const hospitalization = await getHospitalizationById(resolvedParams.id);

  if (!hospitalization) {
    notFound();
  }

  const totalFee = hospitalization.feeItems.reduce((sum, f) => sum + f.totalPrice, 0);

  const getStaffName = async (id: string) => {
    const staff = await getStaffById(id);
    return staff?.name || "-";
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/" className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-flex items-center gap-1">
          ← 返回列表
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {hospitalization.pet.name}
              </h1>
              <HospitalizationStatusBadge status={hospitalization.status} />
              <AnomalyBadge type={hospitalization.anomalyType} />
            </div>
            <p className="text-gray-600 mt-1">
              {hospitalization.department.name} · {hospitalization.ward} · {hospitalization.cageNumber}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/hospitalizations/${hospitalization.id}/nursing`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              护理记录
            </Link>
            <Link
              href={`/hospitalizations/${hospitalization.id}/orders`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              医嘱管理
            </Link>
            <Link
              href={`/hospitalizations/${hospitalization.id}/finance`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              费用复核
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">宠物信息</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-3xl">
                    🐾
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-lg">{hospitalization.pet.name}</div>
                    <div className="text-sm text-gray-500">
                      {hospitalization.pet.breed || hospitalization.pet.type}
                    </div>
                    <div className="text-sm text-gray-500">
                      {hospitalization.pet.gender || "未知"} · {hospitalization.pet.age ? `${hospitalization.pet.age}岁` : ""} · {hospitalization.pet.weight ? `${hospitalization.pet.weight}kg` : ""}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">主人信息</h3>
                <div>
                  <div className="font-medium text-gray-900">{hospitalization.pet.owner.name}</div>
                  <div className="text-sm text-gray-500">{hospitalization.pet.owner.phone}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {hospitalization.pet.owner.address}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-6 pt-6 grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">入院时间</div>
                <div className="font-medium text-gray-900 mt-1">
                  {formatDateTime(hospitalization.admissionDate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">出院时间</div>
                <div className="font-medium text-gray-900 mt-1">
                  {hospitalization.dischargeDate
                    ? formatDateTime(hospitalization.dischargeDate)
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">住院天数</div>
                <div className="font-medium text-gray-900 mt-1">
                  {calculateStayDays(
                    hospitalization.admissionDate,
                    hospitalization.dischargeDate
                  )}{" "}
                  天
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">主管科室</div>
                <div className="font-medium text-gray-900 mt-1">
                  {hospitalization.department.name}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">诊断信息</h2>
            <div>
              <div className="text-sm text-gray-500 mb-1">主诉</div>
              <p className="text-gray-700">{hospitalization.chiefComplaint || "-"}</p>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">主要诊断</div>
              <p className="text-gray-700 font-medium">{hospitalization.primaryDiagnosis}</p>
            </div>
            {hospitalization.secondaryDiagnosis && (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-1">次要诊断</div>
                <p className="text-gray-700">{hospitalization.secondaryDiagnosis}</p>
              </div>
            )}
            {hospitalization.anomalyType !== "NONE" && hospitalization.anomalyNote && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm font-medium text-amber-800 mb-1">异常备注</div>
                <p className="text-sm text-amber-700">{hospitalization.anomalyNote}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">医嘱列表</h2>
              <Link
                href={`/hospitalizations/${hospitalization.id}/orders`}
                className="text-primary-600 hover:text-primary-800 text-sm"
              >
                管理 →
              </Link>
            </div>
            <div className="space-y-3">
              {hospitalization.medicalOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {order.orderType}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-gray-700 mt-1">{order.content}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        {order.dosage && <span>剂量: {order.dosage}</span>}
                        {order.frequency && <span>频次: {order.frequency}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        开始: {formatDate(order.startDate)}
                        {order.endDate && ` · 结束: ${formatDate(order.endDate)}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {hospitalization.medicalOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">暂无医嘱</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">护理时间线</h2>
              <Link
                href={`/hospitalizations/${hospitalization.id}/nursing`}
                className="text-primary-600 hover:text-primary-800 text-sm"
              >
                填写记录 →
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {hospitalization.nursingRecords.map((record, index) => (
                  <div key={record.id} className="relative pl-10">
                    <div
                      className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${
                        record.isAbnormal ? "bg-danger-500" : "bg-primary-500"
                      }`}
                    ></div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <NursingTypeBadge type={record.type} />
                          {record.isAbnormal && (
                            <span className="text-xs px-2 py-0.5 bg-danger-100 text-danger-700 rounded-full">
                              异常
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(record.recordTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{record.content}</p>
                      {(record.temperature ||
                        record.heartRate ||
                        record.respiratoryRate ||
                        record.mentalStatus ||
                        record.appetite) && (
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          {record.temperature && (
                            <span>体温: {record.temperature.toFixed(1)}°C</span>
                          )}
                          {record.heartRate && (
                            <span>心率: {record.heartRate}次/分</span>
                          )}
                          {record.respiratoryRate && (
                            <span>呼吸: {record.respiratoryRate}次/分</span>
                          )}
                          {record.mentalStatus && <span>精神: {record.mentalStatus}</span>}
                          {record.appetite && <span>食欲: {record.appetite}</span>}
                          {record.stool && <span>粪便: {record.stool}</span>}
                        </div>
                      )}
                      {record.abnormalNote && (
                        <div className="mt-2 p-2 bg-danger-50 text-danger-700 text-xs rounded">
                          异常说明: {record.abnormalNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">费用汇总</h2>
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500">累计费用</div>
              <div className="text-3xl font-bold text-primary-600 mt-1">
                {formatCurrency(totalFee)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                共 {hospitalization.feeItems.length} 项
              </div>
            </div>
            <Link
              href={`/hospitalizations/${hospitalization.id}/finance`}
              className="w-full block text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              费用复核与结算
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">费用明细</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {hospitalization.feeItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </div>
                    <FeeStatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hospitalization.feeReviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">费用复核记录</h2>
              <div className="space-y-4">
                {hospitalization.feeReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          review.isFinal
                            ? "bg-success-100 text-success-700"
                            : "bg-warning-100 text-warning-700"
                        }`}
                      >
                        {review.isFinal ? "最终复核" : "临时复核"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(review.reviewedAt)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">应收:</span>
                        <span className="font-medium">
                          {formatCurrency(review.totalAmount)}
                        </span>
                      </div>
                      {review.actualAmount && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">实收:</span>
                          <span className="font-medium text-primary-600">
                            {formatCurrency(review.actualAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                    {review.reviewNote && (
                      <p className="text-xs text-gray-600 mt-2">{review.reviewNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">历史节点</h2>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                <div className="relative pl-8">
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-success-500"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">入院登记</div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(hospitalization.admissionDate)}
                    </div>
                  </div>
                </div>
                {hospitalization.status !== "ADMITTED" && (
                  <div className="relative pl-8">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-primary-500"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">开始治疗</div>
                      <div className="text-xs text-gray-500">
                        {hospitalization.medicalOrders.length > 0
                          ? formatDateTime(hospitalization.medicalOrders[0].startDate)
                          : "-"}
                      </div>
                    </div>
                  </div>
                )}
                {hospitalization.status === "READY_FOR_DISCHARGE" && (
                  <div className="relative pl-8">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-warning-500"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">待出院</div>
                      <div className="text-xs text-gray-500">
                        {hospitalization.dischargeDate
                          ? formatDateTime(hospitalization.dischargeDate)
                          : "-"}
                      </div>
                    </div>
                  </div>
                )}
                {hospitalization.status === "DISCHARGED" && (
                  <div className="relative pl-8">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-gray-500"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">已出院</div>
                      <div className="text-xs text-gray-500">
                        {hospitalization.dischargeDate
                          ? formatDateTime(hospitalization.dischargeDate)
                          : "-"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
