import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSampleList } from "@/lib/actions/sample-actions";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Filter, FlaskConical } from "lucide-react";
import type { SampleStatus } from "@prisma/client";

interface SamplesPageProps {
  searchParams: Promise<{
    status?: string;
    port?: string;
    search?: string;
  }>;
}

export default async function SamplesPage({ searchParams }: SamplesPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const samples = await getSampleList({
    status: params.status as SampleStatus | undefined,
    port: params.port,
    search: params.search,
  });

  const statusOptions: { value: SampleStatus | ""; label: string }[] = [
    { value: "", label: "全部状态" },
    { value: "SAMPLING", label: "待取样" },
    { value: "SAMPLED", label: "已取样" },
    { value: "SENT_TO_LAB", label: "已送检" },
    { value: "TESTING", label: "检测中" },
    { value: "PENDING_DISPOSAL", label: "待处置" },
    { value: "DISPOSED", label: "已处置" },
    { value: "RE_SAMPLING", label: "需重取" },
    { value: "ARCHIVED", label: "已归档" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">样品管理</h1>
          <p className="text-slate-500 mt-1">查看和管理所有查验样品</p>
        </div>
        {session.user.role === "INSPECTION_OFFICER" && (
          <Link
            href="/samples/new"
            className="inline-flex items-center px-4 py-2 bg-customs-600 hover:bg-customs-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            新建取样
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center">
          <form className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="搜索样品编号、报关单、货物名称..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              name="status"
              defaultValue={params.status || ""}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-5 py-3 font-medium">样品编号</th>
                <th className="px-5 py-3 font-medium">报关单号</th>
                <th className="px-5 py-3 font-medium">货物名称</th>
                <th className="px-5 py-3 font-medium">商品类别</th>
                <th className="px-5 py-3 font-medium">口岸</th>
                <th className="px-5 py-3 font-medium">封签状态</th>
                <th className="px-5 py-3 font-medium">样品状态</th>
                <th className="px-5 py-3 font-medium">当前责任人</th>
                <th className="px-5 py-3 font-medium">创建时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {samples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="text-customs-600 hover:text-customs-700 font-medium"
                    >
                      {sample.sampleNo}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {sample.customsDeclarationNo}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{sample.goodsName}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {sample.goodsCategory}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{sample.port}</td>
                  <td className="px-5 py-4">
                    {sample.seals.length > 0 && (
                      <StatusBadge
                        status={sample.seals[0].status}
                        type="seal"
                      />
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={sample.status} type="sample" />
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {sample.currentHandler?.name || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {formatDate(sample.createdAt)}
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
              {samples.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FlaskConical className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500">暂无样品数据</p>
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
