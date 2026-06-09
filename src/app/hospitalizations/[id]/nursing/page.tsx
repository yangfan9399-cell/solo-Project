import Link from "next/link";
import { notFound } from "next/navigation";
import { getHospitalizationById, getStaffById, getStaffByRole } from "../../../../lib/api";
import { NursingTypeBadge } from "../../../../components/StatusBadge";
import { formatDateTime } from "../../../../lib/utils";
import { StaffRole, NursingType } from "../../../../types/enums";

export const dynamic = "force-dynamic";

export default async function NursingPage({
  params,
}: {
  params: { id: string };
}) {
  const hospitalization = await getHospitalizationById(params.id);

  if (!hospitalization) {
    notFound();
  }

  const nurses = await getStaffByRole(StaffRole.NURSE);

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
              护理记录 - {hospitalization.pet.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {hospitalization.department.name} · {hospitalization.primaryDiagnosis}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">护理记录列表</h2>
            <div className="space-y-4">
              {hospitalization.nursingRecords.map((record) => {
                const nursePromise = getStaffById(record.recordedById);
                return (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border ${
                      record.isAbnormal
                        ? "bg-danger-50 border-danger-200"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <NursingTypeBadge type={record.type} />
                        {record.isAbnormal && (
                          <span className="text-xs px-2 py-0.5 bg-danger-500 text-white rounded-full">
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
                      record.appetite ||
                      record.stool ||
                      record.urine) && (
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        {record.temperature && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">体温: </span>
                            <span className="font-medium">{record.temperature.toFixed(1)}°C</span>
                          </div>
                        )}
                        {record.heartRate && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">心率: </span>
                            <span className="font-medium">{record.heartRate}次/分</span>
                          </div>
                        )}
                        {record.respiratoryRate && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">呼吸: </span>
                            <span className="font-medium">{record.respiratoryRate}次/分</span>
                          </div>
                        )}
                        {record.mentalStatus && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">精神: </span>
                            <span className="font-medium">{record.mentalStatus}</span>
                          </div>
                        )}
                        {record.appetite && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">食欲: </span>
                            <span className="font-medium">{record.appetite}</span>
                          </div>
                        )}
                        {record.stool && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">粪便: </span>
                            <span className="font-medium">{record.stool}</span>
                          </div>
                        )}
                        {record.urine && (
                          <div className="bg-white p-2 rounded">
                            <span className="text-gray-500">尿液: </span>
                            <span className="font-medium">{record.urine}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {record.abnormalNote && (
                      <div className="p-2 bg-white text-danger-700 text-xs rounded border border-danger-200">
                        <span className="font-medium">异常说明: </span>
                        {record.abnormalNote}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      记录护士: 李护士
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">新增护理记录</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  护理类型
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value={NursingType.VITAL_SIGNS}>生命体征监测</option>
                  <option value={NursingType.MEDICATION}>给药记录</option>
                  <option value={NursingType.TREATMENT}>治疗护理</option>
                  <option value={NursingType.FEEDING}>喂食</option>
                  <option value={NursingType.GROOMING}>清洁护理</option>
                  <option value={NursingType.OTHER}>其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  记录内容
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="请输入护理记录内容"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体温 (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="38.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    心率 (次/分)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    呼吸 (次/分)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="25.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    食欲
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">正常</option>
                    <option value="良好">良好</option>
                    <option value="一般">一般</option>
                    <option value="差">差</option>
                    <option value="废绝">废绝</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    精神状态
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">正常</option>
                    <option value="活泼">活泼</option>
                    <option value="良好">良好</option>
                    <option value="一般">一般</option>
                    <option value="沉郁">沉郁</option>
                    <option value="萎靡">萎靡</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-primary-600" />
                  <span className="text-sm text-gray-700">是否为异常记录</span>
                </label>
              </div>

              <button
                type="button"
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                提交护理记录
              </button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <span className="font-medium">护士：</span>李护士（内科）
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
