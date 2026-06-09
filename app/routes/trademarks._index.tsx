import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { differenceInDays, format } from "date-fns";
import type { TrademarkStatus } from "@prisma/client";

export const meta: MetaFunction = () => {
  return [{ title: "商标管理 - 商标续展管理系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  let whereClause: any = {};
  
  if (user.role === "CLIENT") {
    whereClause.clientId = user.id;
  } else if (user.role === "CONSULTANT") {
    whereClause.consultantId = user.id;
  }

  if (status && status !== "all") {
    whereClause.status = status;
  }

  if (search) {
    whereClause.OR = [
      { trademarkNo: { contains: search, mode: "insensitive" } },
      { trademarkName: { contains: search, mode: "insensitive" } },
    ];
  }

  const trademarks = await prisma.trademark.findMany({
    where: whereClause,
    orderBy: [
      { isExpedited: "desc" },
      { expiryDate: "asc" },
      { updatedAt: "desc" },
    ],
    include: {
      client: { select: { name: true } },
      consultant: { select: { name: true } },
      _count: {
        select: { documents: true },
      },
    },
  });

  return json({ user, trademarks, status, search });
}

export default function Trademarks() {
  const { user, trademarks, status, search } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusOptions: { value: string; label: string }[] = [
    { value: "all", label: "全部状态" },
    { value: "DRAFT", label: "草稿" },
    { value: "PENDING_UPLOAD", label: "待上传" },
    { value: "MATERIALS_UPLOADED", label: "材料已上传" },
    { value: "MATERIALS_DEFICIENT", label: "材料缺失" },
    { value: "AGENT_APPROVED", label: "待递交" },
    { value: "SUBMITTED", label: "已递交" },
    { value: "SUPERVISOR_REVIEW", label: "复核中" },
    { value: "ARCHIVED", label: "已归档" },
    { value: "ABANDONED", label: "已放弃" },
    { value: "EXPEDITED", label: "加急处理" },
  ];

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {user.role === "CLIENT" ? "我的商标" : 
             user.role === "AGENT" ? "审核队列" :
             user.role === "SUPERVISOR" ? "复核队列" : "商标管理"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            共 {trademarks.length} 个商标
          </p>
        </div>
        {user.role === "CONSULTANT" && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/trademarks/new"
              className="btn btn-primary"
            >
              登记新商标
            </Link>
          </div>
        )}
      </div>

      <div className="card">
        <div className="px-4 py-4 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="status" className="sr-only">状态筛选</label>
                <select
                  id="status"
                  value={status || "all"}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value === "all") {
                      params.delete("status");
                    } else {
                      params.set("status", e.target.value);
                    }
                    setSearchParams(params);
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="搜索商标号或名称..."
                  value={search || ""}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      params.set("search", e.target.value);
                    } else {
                      params.delete("search");
                    }
                    setSearchParams(params);
                  }}
                  className="block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商标信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  到期日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {user.role === "CLIENT" ? "顾问" : "客户"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trademarks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无商标数据
                  </td>
                </tr>
              ) : (
                trademarks.map((trademark) => {
                  const daysLeft = differenceInDays(
                    new Date(trademark.expiryDate),
                    new Date()
                  );
                  const isUrgent = daysLeft <= 30;
                  const isExpiring = daysLeft <= 90;

                  return (
                    <tr
                      key={trademark.id}
                      className={`hover:bg-gray-50 ${
                        trademark.isExpedited ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {trademark.trademarkName}
                              </span>
                              {trademark.isExpedited && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  加急
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trademark.trademarkNo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          第{trademark.category}类
                        </div>
                        <div className="text-sm text-gray-500">
                          {trademark.categoryName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(trademark.expiryDate), "yyyy-MM-dd")}
                        </div>
                        {isExpiring && daysLeft > 0 && (
                          <div
                            className={`text-sm font-medium ${
                              isUrgent ? "text-red-600" : "text-yellow-600"
                            }`}
                          >
                            剩余 {daysLeft} 天
                          </div>
                        )}
                        {daysLeft <= 0 && (
                          <div className="text-sm font-medium text-red-600">
                            已过期
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role === "CLIENT"
                          ? trademark.consultant.name
                          : trademark.client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={trademark.status as TrademarkStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/trademarks/${trademark.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
