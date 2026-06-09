import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHospitalizationById,
  checkDischargeAllowed,
} from "../../../../lib/api";
import {
  confirmFeeItem,
  disputeFeeItem,
  resolveFeeDispute,
  dischargeHospitalization,
} from "../../../../lib/actions";
import { FeeStatusBadge } from "../../../../components/StatusBadge";
import { formatCurrency, formatDateTime } from "../../../../lib/utils";
import {
  HospitalizationStatus,
  FeeStatus,
  OrderStatus,
} from "../../../../types/enums";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const hospitalization = await getHospitalizationById(resolvedParams.id);

  if (!hospitalization) {
    notFound();
  }

  const totalFee = hospitalization.feeItems.reduce(
    (sum, f) => sum + f.totalPrice,
    0
  );
  const settledFee = hospitalization.feeItems
    .filter((f) => f.status === FeeStatus.SETTLED)
    .reduce((sum, f) => sum + f.totalPrice, 0);
  const pendingFee = hospitalization.feeItems
    .filter((f) => f.status === FeeStatus.PENDING)
    .reduce((sum, f) => sum + f.totalPrice, 0);
  const disputedFee = hospitalization.feeItems
    .filter((f) => f.status === FeeStatus.DISPUTED)
    .reduce((sum, f) => sum + f.totalPrice, 0);
  const confirmedFee = hospitalization.feeItems
    .filter((f) => f.status === FeeStatus.CONFIRMED)
    .reduce((sum, f) => sum + f.totalPrice, 0);

  const dischargeCheck = await checkDischargeAllowed(resolvedParams.id);
  const pendingOrders = hospitalization.medicalOrders.filter(
    (o) => o.status === OrderStatus.PENDING
  );
  const pendingFees = hospitalization.feeItems.filter(
    (f) => f.status === FeeStatus.PENDING
  );
  const disputedFees = hospitalization.feeItems.filter(
    (f) => f.status === FeeStatus.DISPUTED
  );

  const canDischarge =
    dischargeCheck.allowed &&
    hospitalization.status !== HospitalizationStatus.DISCHARGED;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/hospitalizations/${hospitalization.id}`}
          className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-flex items-center gap-1"
        >
          ← 返回详情
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              费用复核 - {hospitalization.pet.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {hospitalization.department.name} ·{" "}
              {hospitalization.primaryDiagnosis}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            共 {hospitalization.feeItems.length} 项费用
          </div>
        </div>
      </div>

      {resolvedSearchParams.error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="font-medium text-danger-900">出院结算失败</h3>
              <p className="text-sm text-danger-700 mt-1">{resolvedSearchParams.error}</p>
            </div>
          </div>
        </div>
      )}

      {!dischargeCheck.allowed && !resolvedSearchParams.error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <h3 className="font-medium text-danger-900">暂时无法办理出院</h3>
              <p className="text-sm text-danger-700 mt-1">{dischargeCheck.reason}</p>
            </div>
          </div>
        </div>
      )}

      {hospitalization.status === HospitalizationStatus.DISCHARGED && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-medium text-success-900">已出院</h3>
              <p className="text-sm text-success-700 mt-1">
                该病例已完成出院结算，所有费用已结清
              </p>
            </div>
          </div>
        </div>
      )}

      {hospitalization.status !== HospitalizationStatus.DISCHARGED &&
        dischargeCheck.allowed && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-medium text-success-900">可以办理出院</h3>
                <p className="text-sm text-success-700 mt-1">
                  所有医嘱已确认，所有费用已确认且无争议，可以办理出院结算
                </p>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">费用概览</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalFee)}
                </div>
                <div className="text-sm text-gray-500 mt-1">总费用</div>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <div className="text-2xl font-bold text-success-600">
                  {formatCurrency(settledFee)}
                </div>
                <div className="text-sm text-gray-500 mt-1">已结算</div>
              </div>
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {formatCurrency(confirmedFee)}
                </div>
                <div className="text-sm text-gray-500 mt-1">已确认</div>
              </div>
              <div className="text-center p-4 bg-warning-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-600">
                  {formatCurrency(pendingFee + disputedFee)}
                </div>
                <div className="text-sm text-gray-500 mt-1">待处理</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">费用明细</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      项目名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      类别
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                      数量
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                      单价
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                      小计
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hospitalization.feeItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.name}
                        </div>
                        {item.disputeNote && (
                          <div className="text-xs text-danger-600 mt-1">
                            争议: {item.disputeNote}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FeeStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status === FeeStatus.PENDING && (
                          <div className="flex gap-1 justify-center">
                            <form action={confirmFeeItem}>
                              <input
                                type="hidden"
                                name="feeId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="hospitalizationId"
                                value={hospitalization.id}
                              />
                              <button
                                type="submit"
                                className="text-xs px-2 py-1 text-success-600 hover:bg-success-50 rounded font-medium"
                              >
                                确认
                              </button>
                            </form>
                            <form action={disputeFeeItem}>
                              <input
                                type="hidden"
                                name="feeId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="hospitalizationId"
                                value={hospitalization.id}
                              />
                              <input
                                type="hidden"
                                name="disputeNote"
                                value="费用有异议，待核实"
                              />
                              <button
                                type="submit"
                                className="text-xs px-2 py-1 text-danger-600 hover:bg-danger-50 rounded font-medium"
                              >
                                争议
                              </button>
                            </form>
                          </div>
                        )}
                        {item.status === FeeStatus.DISPUTED && (
                          <div className="flex gap-1 justify-center">
                            <form action={resolveFeeDispute}>
                              <input
                                type="hidden"
                                name="feeId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="hospitalizationId"
                                value={hospitalization.id}
                              />
                              <input
                                type="hidden"
                                name="resolution"
                                value="confirm"
                              />
                              <button
                                type="submit"
                                className="text-xs px-2 py-1 text-primary-600 hover:bg-primary-50 rounded font-medium"
                              >
                                按原价确认
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pendingOrders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                待确认医嘱（影响出院）
              </h2>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-amber-900">
                          {order.orderType}: {order.content}
                        </div>
                        <div className="text-sm text-amber-700 mt-1">
                          剂量: {order.dosage} · 频次: {order.frequency}
                        </div>
                      </div>
                      <Link
                        href={`/hospitalizations/${hospitalization.id}/orders`}
                        className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
                      >
                        去确认
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                💡 提示：所有医嘱确认后，出院结算按钮将自动解锁
              </p>
            </div>
          )}

          {pendingFees.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                待确认费用（影响出院）
              </h2>
              <div className="space-y-3">
                {pendingFees.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">
                          {item.name} - {formatCurrency(item.totalPrice)}
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          类别: {item.category} · 数量: {item.quantity}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <form action={confirmFeeItem}>
                          <input
                            type="hidden"
                            name="feeId"
                            value={item.id}
                          />
                          <input
                            type="hidden"
                            name="hospitalizationId"
                            value={hospitalization.id}
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-success-600 text-white text-sm rounded-lg hover:bg-success-700"
                          >
                            确认费用
                          </button>
                        </form>
                        <form action={disputeFeeItem}>
                          <input
                            type="hidden"
                            name="feeId"
                            value={item.id}
                          />
                          <input
                            type="hidden"
                            name="hospitalizationId"
                            value={hospitalization.id}
                          />
                          <input
                            type="hidden"
                            name="disputeNote"
                            value="费用有异议，待核实"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-danger-600 text-white text-sm rounded-lg hover:bg-danger-700"
                          >
                            标记争议
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                💡 提示：所有费用确认或解决争议后，出院结算按钮将自动解锁
              </p>
            </div>
          )}

          {disputedFees.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                争议费用（影响出院）
              </h2>
              <div className="space-y-3">
                {disputedFees.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-danger-50 border border-danger-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-danger-900">
                          {item.name} - {formatCurrency(item.totalPrice)}
                        </div>
                        <div className="text-sm text-danger-700 mt-1">
                          争议原因: {item.disputeNote}
                        </div>
                      </div>
                      <form action={resolveFeeDispute}>
                        <input
                          type="hidden"
                          name="feeId"
                          value={item.id}
                        />
                        <input
                          type="hidden"
                          name="hospitalizationId"
                          value={hospitalization.id}
                        />
                        <input
                          type="hidden"
                          name="resolution"
                          value="confirm"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                        >
                          确认解决
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">结算操作</h2>

            {hospitalization.status === HospitalizationStatus.DISCHARGED ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-lg font-medium text-gray-900">已出院结算</div>
                <div className="text-sm text-gray-500 mt-1">
                  出院时间: {hospitalization.dischargeDate
                    ? formatDateTime(hospitalization.dischargeDate)
                    : "-"}
                </div>
              </div>
            ) : (
              <form action={dischargeHospitalization} className="space-y-4">
                <input
                  type="hidden"
                  name="hospitalizationId"
                  value={hospitalization.id}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    应收金额（已确认）
                  </label>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(confirmedFee)}
                  </div>
                  {pendingFees.length + disputedFees.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      另有 {pendingFees.length + disputedFees.length} 项待处理费用未计入
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    实收金额（已确认）
                  </label>
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(confirmedFee)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支付方式
                  </label>
                  <select
                    name="paymentMethod"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option>微信支付</option>
                    <option>支付宝</option>
                    <option>银行卡</option>
                    <option>现金</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    复核备注
                  </label>
                  <textarea
                    name="reviewNote"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                    placeholder="费用复核说明或出院小结"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canDischarge}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    canDischarge
                      ? "bg-success-600 text-white hover:bg-success-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  确认结算并办理出院
                </button>

                {!canDischarge && (
                  <p className="text-xs text-danger-600 mt-2 text-center">
                    {dischargeCheck.reason}
                  </p>
                )}
              </form>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <span className="font-medium">财务：</span>赵财务
              </p>
              <p className="text-xs text-blue-700 mt-1">
                办理出院前请确保所有医嘱已确认、所有费用已确认且无争议
              </p>
            </div>
          </div>

          {hospitalization.feeReviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                复核记录
              </h2>
              <div className="space-y-3">
                {hospitalization.feeReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          review.isFinal
                            ? "bg-success-100 text-success-700"
                            : "bg-warning-100 text-warning-700"
                        }`}
                      >
                        {review.isFinal ? "最终结算" : "临时复核"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(review.reviewedAt)}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">应收:</span>
                        <span className="font-medium">
                          {formatCurrency(review.totalAmount)}
                        </span>
                      </div>
                      {review.actualAmount !== undefined &&
                        review.actualAmount !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">实收:</span>
                            <span className="font-medium text-success-600">
                              {formatCurrency(review.actualAmount)}
                            </span>
                          </div>
                        )}
                    </div>
                    {review.reviewNote && (
                      <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                        {review.reviewNote}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      复核人: 赵财务
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
