import Link from "next/link";
import { notFound } from "next/navigation";
import { getHospitalizationById } from "../../../../lib/api";
import { OrderStatusBadge } from "../../../../components/StatusBadge";
import { formatDate } from "../../../../lib/utils";
import { OrderStatus } from "../../../../types/enums";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  params,
}: {
  params: { id: string };
}) {
  const hospitalization = await getHospitalizationById(params.id);

  if (!hospitalization) {
    notFound();
  }

  const pendingOrders = hospitalization.medicalOrders.filter(
    (o) => o.status === OrderStatus.PENDING
  );

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
              医嘱管理 - {hospitalization.pet.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {hospitalization.department.name} · {hospitalization.primaryDiagnosis}
            </p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            + 新增医嘱
          </button>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-medium text-amber-900">
                存在 {pendingOrders.length} 条待确认医嘱
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                待确认的医嘱将阻止出院结算，请兽医及时确认或处理
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">所有医嘱</h2>
            <div className="space-y-4">
              {hospitalization.medicalOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-5 rounded-xl border ${
                    order.status === OrderStatus.PENDING
                      ? "border-amber-300 bg-amber-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        💊
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {order.orderType}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          开始: {formatDate(order.startDate)}
                          {order.endDate && ` · 结束: ${formatDate(order.endDate)}`}
                        </div>
                      </div>
                    </div>
                    {order.status === OrderStatus.PENDING && (
                      <button className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
                        确认医嘱
                      </button>
                    )}
                  </div>

                  <div className="pl-13">
                    <p className="text-gray-700 mb-3">{order.content}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {order.dosage && (
                        <div>
                          <span className="text-gray-500">剂量: </span>
                          {order.dosage}
                        </div>
                      )}
                      {order.frequency && (
                        <div>
                          <span className="text-gray-500">频次: </span>
                          {order.frequency}
                        </div>
                      )}
                    </div>

                    {order.note && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        <span className="font-medium">备注: </span>
                        {order.note}
                      </div>
                    )}

                    {order.confirmedAt && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                        <span>开嘱医生: 陈兽医</span>
                        <span>确认时间: {formatDate(order.confirmedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">新增医嘱</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  医嘱类型
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>药物治疗</option>
                  <option>输液治疗</option>
                  <option>手术治疗</option>
                  <option>雾化治疗</option>
                  <option>液体治疗</option>
                  <option>检查检验</option>
                  <option>护理医嘱</option>
                  <option>其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  医嘱内容
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="请输入详细的医嘱内容"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    剂量
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如：0.5g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    频次
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如：每日2次"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="特殊说明或注意事项"
                />
              </div>

              <button
                type="button"
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                提交医嘱（待确认）
              </button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <span className="font-medium">兽医：</span>陈兽医（内科）
              </p>
              <p className="text-xs text-blue-700 mt-1">
                新增医嘱需兽医确认后方可执行
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
