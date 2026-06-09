import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDisposalTasks } from "@/lib/actions/lab-disposal-actions";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { FileCheck, AlertTriangle, Gavel, AlertCircle } from "lucide-react";
import { getMissingRequiredTests, getFailedTests } from "@/lib/test-validation";

export default async function DisposalsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DISPOSAL_REVIEWER") {
    redirect("/login");
  }

  const tasks = await getDisposalTasks();

  const tasksWithStats = tasks.map((sample) => {
    const { missingCount, hasMissing } = getMissingRequiredTests(
      sample.testItems,
      sample.testResults
    );
    const failedCount = getFailedTests(sample.testResults).length;
    const passedCount = sample.testResults.filter(
      (r) => r.resultStatus === "PASSED"
    ).length;
    return {
      ...sample,
      missingCount,
      hasMissing,
      failedCount,
      passedCount,
    };
  });

  const missingTestTasks = tasksWithStats.filter((t) => t.hasMissing);
  const failedTestTasks = tasksWithStats.filter((t) => t.failedCount > 0);
  const abnormalTasks = tasksWithStats.filter(
    (t) => t.hasMissing || t.failedCount > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">处置复核</h1>
        <p className="text-slate-500 mt-1">对检测完成的样品进行处置结论复核</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">待处置</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {tasks.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">漏检项目</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {missingTestTasks.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-5 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">检测不合格</p>
              <p className="text-2xl font-bold text-red-800 mt-1">
                {failedTestTasks.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">平均检测项</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">
                {tasks.length > 0
                  ? Math.round(
                      tasks.reduce((sum, t) => sum + t.testItems.length, 0) /
                        tasks.length
                    )
                  : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Gavel className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">待处置样品列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">样品编号</th>
                <th className="px-5 py-3 font-medium">货物名称</th>
                <th className="px-5 py-3 font-medium">必检/总项</th>
                <th className="px-5 py-3 font-medium">合格项</th>
                <th className="px-5 py-3 font-medium">不合格项</th>
                <th className="px-5 py-3 font-medium">漏检项</th>
                <th className="px-5 py-3 font-medium">封签状态</th>
                <th className="px-5 py-3 font-medium">检测完成时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {tasksWithStats.map((sample) => (
                <tr
                  key={sample.id}
                  className={`hover:bg-slate-50 ${
                    sample.hasMissing ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="text-customs-600 hover:text-customs-700 font-medium"
                    >
                      {sample.sampleNo}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {sample.goodsName}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {sample.testItems.filter((i) => i.isRequired).length}/
                    {sample.testItems.length}
                  </td>
                  <td className="px-5 py-4 text-green-600 font-medium">
                    {sample.passedCount} 项
                  </td>
                  <td className="px-5 py-4">
                    {sample.failedCount > 0 ? (
                      <span className="text-red-600 font-medium">
                        {sample.failedCount} 项
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {sample.hasMissing ? (
                      <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-md font-medium">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        {sample.missingCount} 项
                      </span>
                    ) : (
                      <span className="text-green-500 text-xs">✓ 齐全</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {sample.seals.length > 0 && (
                      <StatusBadge
                        status={sample.seals[0].status}
                        type="seal"
                      />
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {sample.testCompletedTime
                      ? formatDate(sample.testCompletedTime)
                      : "-"}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="text-customs-600 hover:text-customs-700"
                    >
                      复核处置
                    </Link>
                  </td>
                </tr>
              ))}
              {tasksWithStats.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Gavel className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500">暂无待处置样品</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
