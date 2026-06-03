import { A } from "@solidjs/router";
import { createAsync, useNavigate } from "@solidjs/router";
import StatCard from "~/components/StatCard";
import StatusBadge from "~/components/StatusBadge";
import EmptyState from "~/components/EmptyState";
import { getDashboardStatsAction, getILLRequestsAction } from "~/server/actions";
import type { ILLRequestDetail } from "~/server/db";

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = createAsync(() => getDashboardStatsAction());
  const recentRequests = createAsync(() => getILLRequestsAction());

  return (
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">仪表盘</h1>
        <p class="text-gray-500">馆际互借与逾期追踪系统概览</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon="📋" label="总申请数" value={stats()?.total || 0} color="blue" />
        <StatCard icon="⏳" label="待处理" value={stats()?.pending || 0} color="yellow" />
        <StatCard icon="📚" label="借阅中" value={stats()?.lending || 0} color="green" />
        <StatCard icon="⚠️" label="已逾期" value={stats()?.overdue || 0} color="red" />
        <StatCard icon="✅" label="已完成" value={stats()?.completed || 0} color="purple" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <div class="card-header flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">最近申请</h2>
            <A href="/requests" class="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </A>
          </div>
          <div class="card-body">
            {(!recentRequests() || recentRequests()?.length === 0) ? (
              <EmptyState 
                icon="📋" 
                title="暂无申请记录" 
                description="还没有馆际互借申请记录"
                action={{ label: "新建申请", onClick: () => navigate("/requests/new") }}
              />
            ) : (
              <div class="space-y-3">
                {recentRequests()?.slice(0, 5).map((req: ILLRequestDetail) => (
                  <A 
                    href={`/requests/${req.id}`}
                    class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-900 truncate">{req.book_title}</p>
                      <p class="text-sm text-gray-500">{req.reader_name} · {req.request_no}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </A>
                ))}
              </div>
            )}
          </div>
        </div>

        <div class="card">
          <div class="card-header flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">快捷操作</h2>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-3">
              <A href="/requests/new" class="p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors text-center">
                <div class="text-3xl mb-2">➕</div>
                <p class="font-medium text-primary-700">新建申请</p>
              </A>
              <A href="/kanban" class="p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-center">
                <div class="text-3xl mb-2">📈</div>
                <p class="font-medium text-green-700">流转看板</p>
              </A>
              <A href="/overdue" class="p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-center">
                <div class="text-3xl mb-2">⚠️</div>
                <p class="font-medium text-red-700">逾期催还</p>
              </A>
              <A href="/exceptions" class="p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-center">
                <div class="text-3xl mb-2">🚨</div>
                <p class="font-medium text-yellow-700">异常反馈</p>
              </A>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
