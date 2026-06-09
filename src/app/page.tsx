import Link from "next/link";
import { getHospitalizations } from "../lib/api";
import { HospitalizationStatusBadge, AnomalyBadge } from "../components/StatusBadge";
import { formatDate, calculateStayDays } from "../lib/utils";
import { HospitalizationStatus, AnomalyType } from "../types/enums";

export const dynamic = "force-dynamic";

export default async function HospitalizationsPage({
  searchParams,
}: {
  searchParams: { status?: string; anomaly?: string };
}) {
  const status = searchParams.status || "ALL";
  const anomaly = searchParams.anomaly || "ALL";
  const hospitalizations = await getHospitalizations(status, anomaly);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">住院管理</h1>
        <p className="text-gray-600">查看和管理所有住院病例</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">状态筛选:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              defaultValue={status}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set("status", e.target.value);
                window.location.search = params.toString();
              }}
            >
              <option value="ALL">全部</option>
              <option value={HospitalizationStatus.ADMITTED}>已入院</option>
              <option value={HospitalizationStatus.IN_TREATMENT}>治疗中</option>
              <option value={HospitalizationStatus.READY_FOR_DISCHARGE}>待出院</option>
              <option value={HospitalizationStatus.DISCHARGED}>已出院</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">异常类型:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              defaultValue={anomaly}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set("anomaly", e.target.value);
                window.location.search = params.toString();
              }}
            >
              <option value="ALL">全部</option>
              <option value={AnomalyType.NONE}>正常</option>
              <option value={AnomalyType.MEDICATION_MISSED}>用药漏记</option>
              <option value={AnomalyType.NURSING_ABNORMAL}>护理异常</option>
              <option value={AnomalyType.FEE_DISPUTE}>费用异议</option>
            </select>
          </div>

          <div className="ml-auto">
            <Link
              href="/admission"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              + 入院登记
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  宠物信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  主人
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  科室
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  诊断
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  住院天数
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  异常
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hospitalizations.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg">🐾</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{h.pet.name}</div>
                        <div className="text-sm text-gray-500">
                          {h.pet.breed || h.pet.type} · {h.pet.age ? `${h.pet.age}岁` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{h.pet.owner.name}</div>
                    <div className="text-sm text-gray-500">{h.pet.owner.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {h.department.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="truncate">{h.primaryDiagnosis}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {calculateStayDays(h.admissionDate, h.dischargeDate)} 天
                    <div className="text-xs text-gray-400">
                      {formatDate(h.admissionDate)}
                      {h.dischargeDate ? ` ~ ${formatDate(h.dischargeDate)}` : " 至今"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <HospitalizationStatusBadge status={h.status} />
                  </td>
                  <td className="px-6 py-4">
                    <AnomalyBadge type={h.anomalyType} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/hospitalizations/${h.id}`}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      查看详情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hospitalizations.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            暂无住院记录
          </div>
        )}
      </div>
    </div>
  );
}
