import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getRecentSamples } from "@/lib/actions/analytics-actions";
import {
  FlaskConical,
  Clock,
  FileCheck,
  AlertTriangle,
  Activity,
  ArrowRight,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats();
  const recentSamples = await getRecentSamples(8);

  const statCards = [
    {
      label: "样品总数",
      value: stats.totalSamples,
      icon: FlaskConical,
      color: "bg-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "今日新增",
      value: stats.todaySamples,
      icon: Activity,
      color: "bg-green-500",
      bg: "bg-green-50",
    },
    {
      label: "检测中",
      value: stats.pendingTests,
      icon: Clock,
      color: "bg-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "待处置",
      value: stats.pendingDisposals,
      icon: FileCheck,
      color: "bg-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "异常样品",
      value: stats.abnormalSamples,
      icon: AlertTriangle,
      color: "bg-red-500",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-5 border border-slate-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">最近样品</h3>
            <Link
              href="/samples"
              className="text-sm text-customs-600 hover:text-customs-700 flex items-center"
            >
              查看全部 <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium">样品编号</th>
                    <th className="pb-3 font-medium">货物名称</th>
                    <th className="pb-3 font-medium">口岸</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">创建时间</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentSamples.map((sample) => (
                    <tr key={sample.id} className="border-t border-slate-100">
                      <td className="py-3">
                        <Link
                          href={`/samples/${sample.id}`}
                          className="text-customs-600 hover:text-customs-700 font-medium"
                        >
                          {sample.sampleNo}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-700">{sample.goodsName}</td>
                      <td className="py-3 text-slate-600">{sample.port}</td>
                      <td className="py-3">
                        <StatusBadge status={sample.status} type="sample" />
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDate(sample.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {recentSamples.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        暂无样品数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">快捷操作</h3>
          </div>
          <div className="p-5 space-y-3">
            {session.user.role === "INSPECTION_OFFICER" && (
              <>
                <Link
                  href="/samples/new"
                  className="flex items-center p-3 bg-customs-50 hover:bg-customs-100 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-customs-500 rounded-lg flex items-center justify-center mr-3">
                    <FlaskConical className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">新建取样登记</p>
                    <p className="text-xs text-slate-500">登记新的查验样品</p>
                  </div>
                </Link>
                <Link
                  href="/samples?status=SAMPLED"
                  className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">待送检样品</p>
                    <p className="text-xs text-slate-500">查看并送检样品</p>
                  </div>
                </Link>
              </>
            )}
            {session.user.role === "LAB_TECHNICIAN" && (
              <>
                <Link
                  href="/lab-tasks"
                  className="flex items-center p-3 bg-customs-50 hover:bg-customs-100 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-customs-500 rounded-lg flex items-center justify-center mr-3">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">我的检测任务</p>
                    <p className="text-xs text-slate-500">查看待检测样品</p>
                  </div>
                </Link>
              </>
            )}
            {session.user.role === "DISPOSAL_REVIEWER" && (
              <>
                <Link
                  href="/disposals"
                  className="flex items-center p-3 bg-customs-50 hover:bg-customs-100 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-customs-500 rounded-lg flex items-center justify-center mr-3">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">待处置样品</p>
                    <p className="text-xs text-slate-500">复核并做出处置结论</p>
                  </div>
                </Link>
              </>
            )}
            <Link
              href="/analytics"
              className="flex items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-slate-800">统计复盘</p>
                <p className="text-xs text-slate-500">查看数据统计分析</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
