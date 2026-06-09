import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLabTasks } from "@/lib/actions/lab-disposal-actions";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { FlaskConical, Clock, ClipboardCheck } from "lucide-react";

export default async function LabTasksPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAB_TECHNICIAN") {
    redirect("/login");
  }

  const tasks = await getLabTasks();

  const pendingReceive = tasks.filter((t) => t.status === "SENT_TO_LAB");
  const testing = tasks.filter((t) => t.status === "TESTING");
  const completed = tasks.filter((t) => t.status === "PENDING_DISPOSAL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">检测任务</h1>
        <p className="text-slate-500 mt-1">实验室检测任务管理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">待收样</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">
                {pendingReceive.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">检测中</p>
              <p className="text-2xl font-bold text-yellow-800 mt-1">
                {testing.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">已完成</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                {completed.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">全部任务</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">样品编号</th>
                <th className="px-5 py-3 font-medium">货物名称</th>
                <th className="px-5 py-3 font-medium">商品类别</th>
                <th className="px-5 py-3 font-medium">检测项目数</th>
                <th className="px-5 py-3 font-medium">封签状态</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">送检时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {tasks.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="text-customs-600 hover:text-customs-700 font-medium"
                    >
                      {sample.sampleNo}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{sample.goodsName}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {sample.goodsCategory}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {sample.testItems.length} 项
                  </td>
                  <td className="px-5 py-4">
                    {sample.seals.length > 0 && (
                      <StatusBadge status={sample.seals[0].status} type="seal" />
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={sample.status} type="sample" />
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {sample.sentToLabTime
                      ? formatDate(sample.sentToLabTime)
                      : "-"}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="text-customs-600 hover:text-customs-700"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FlaskConical className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500">暂无检测任务</p>
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
