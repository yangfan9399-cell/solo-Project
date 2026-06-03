import { A } from "@solidjs/router";
import { createAsync, useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import StatusBadge from "~/components/StatusBadge";
import EmptyState from "~/components/EmptyState";
import { getILLRequestsAction, getLibrariesAction } from "~/server/actions";
import type { ILLRequestDetail, ILLRequestStatus } from "~/server/db";

const statusOptions: { value: ILLRequestStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待匹配" },
  { value: "matched", label: "已匹配" },
  { value: "approved", label: "已审批" },
  { value: "shipped", label: "运输中" },
  { value: "received", label: "已到馆" },
  { value: "lending", label: "借阅中" },
  { value: "overdue", label: "已逾期" },
  { value: "completed", label: "已完成" }
];

export default function Requests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = createSignal(searchParams.search || "");
  const [statusFilter, setStatusFilter] = createSignal<ILLRequestStatus | "">(searchParams.status as ILLRequestStatus || "");
  const [libraryFilter, setLibraryFilter] = createSignal(searchParams.library || "");

  const libraries = createAsync(() => getLibrariesAction());
  const requests = createAsync(() => {
    const filters: any = {};
    if (statusFilter()) filters.status = statusFilter();
    if (libraryFilter()) filters.libraryId = Number(libraryFilter());
    return getILLRequestsAction(filters);
  });

  const filteredRequests = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return requests();
    return requests()?.filter((req: ILLRequestDetail) => 
      req.book_title.toLowerCase().includes(query) ||
      req.reader_name.toLowerCase().includes(query) ||
      req.request_no.toLowerCase().includes(query)
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSearchParams({ ...searchParams, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ILLRequestStatus);
    setSearchParams({ ...searchParams, status: value || undefined });
  };

  const handleLibraryChange = (value: string) => {
    setLibraryFilter(value);
    setSearchParams({ ...searchParams, library: value || undefined });
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">借阅申请</h1>
          <p class="text-gray-500">管理所有馆际互借申请</p>
        </div>
        <A href="/requests/new" class="btn-primary">
          ➕ 新建申请
        </A>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <input
                type="text"
                placeholder="搜索书名、读者或申请号..."
                class="input"
                value={searchQuery()}
                onInput={(e) => handleSearch(e.currentTarget.value)}
              />
            </div>
            <div class="flex gap-4">
              <select
                class="select w-40"
                value={statusFilter()}
                onChange={(e) => handleStatusChange(e.currentTarget.value)}
              >
                <For each={statusOptions}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
              <select
                class="select w-48"
                value={libraryFilter()}
                onChange={(e) => handleLibraryChange(e.currentTarget.value)}
              >
                <option value="">全部图书馆</option>
                <For each={libraries()}>
                  {(lib) => <option value={lib.id}>{lib.name}</option>}
                </For>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请编号</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图书信息</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">读者</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请馆/提供馆</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {(!filteredRequests() || filteredRequests()?.length === 0) ? (
                <tr>
                  <td colSpan={7} class="px-6 py-12">
                    <EmptyState 
                      icon="📋" 
                      title="暂无申请记录" 
                      description="没有找到符合条件的申请记录"
                    />
                  </td>
                </tr>
              ) : (
                <For each={filteredRequests()}>
                  {(req: ILLRequestDetail) => (
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap font-mono text-sm text-primary-600">
                        {req.request_no}
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">{req.book_title}</div>
                        <div class="text-sm text-gray-500">{req.book_author}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">{req.reader_name}</div>
                        <div class="text-sm text-gray-500">{req.reader_card}</div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">{req.requesting_library_name}</div>
                        <div class="text-sm text-gray-500">
                          {req.supplying_library_name || "待匹配"}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {req.request_date}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <A href={`/requests/${req.id}`} class="text-primary-600 hover:text-primary-900">
                          查看详情
                        </A>
                      </td>
                    </tr>
                  )}
                </For>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
