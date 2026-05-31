import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { StatusBadge } from '~/components/ui/status-badge';
import { PROCESS_STATUS_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Process, Book, User, ProcessStatus } from '~/types';
import clsx from 'clsx';

export const useProcessesData = routeLoader$(async () => {
  try {
    const [processes, books, users] = await Promise.all([
      serverFetch<Process[]>('/processes'),
      serverFetch<Book[]>('/books'),
      serverFetch<User[]>('/users'),
    ]);
    return { processes, books, users, success: true };
  } catch (e) {
    console.error('Failed to load processes data:', e);
    return { processes: [], books: [], users: [], success: false };
  }
});

export default component$(() => {
  const initialData = useProcessesData();
  const state = useStore({
    processes: [] as Process[],
    books: [] as Book[],
    users: [] as User[],
    filterBook: '',
    filterStatus: '',
    draggingProcess: null as string | null,
    isLoading: false,
    error: '',
  });

  useVisibleTask$(() => {
    state.processes = initialData.value.processes;
    state.books = initialData.value.books;
    state.users = initialData.value.users;
  });

  const getBookTitle = (bookId: string) => {
    return state.books.find(b => b.id === bookId)?.title || '未知古籍';
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '未分配';
    return state.users.find(u => u.id === userId)?.name || '未知用户';
  };

  const filteredProcesses = state.processes.filter(p => {
    const matchBook = !state.filterBook || p.book_id === state.filterBook;
    const matchStatus = !state.filterStatus || p.status === state.filterStatus;
    return matchBook && matchStatus;
  }).sort((a, b) => a.order_index - b.order_index);

  const processesByStatus = {
    pending: filteredProcesses.filter(p => p.status === 'pending'),
    in_progress: filteredProcesses.filter(p => p.status === 'in_progress'),
    completed: filteredProcesses.filter(p => p.status === 'completed'),
    skipped: filteredProcesses.filter(p => p.status === 'skipped'),
  };

  const statusColors: Record<string, string> = {
    pending: 'border-gray-300',
    in_progress: 'border-blue-400',
    completed: 'border-green-400',
    skipped: 'border-gray-400',
  };

  const updateProcessStatus = $(async (processId: string, newStatus: ProcessStatus) => {
    try {
      state.isLoading = true;
      state.error = '';
      
      await fetchApi(`/processes/${processId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      const index = state.processes.findIndex(p => p.id === processId);
      if (index !== -1) {
        state.processes[index].status = newStatus;
      }
    } catch (e) {
      state.error = '更新工序状态失败，请重试';
      console.error('Failed to update process status:', e);
    } finally {
      state.isLoading = false;
    }
  });

  const handleDragStart = $((processId: string) => {
    state.draggingProcess = processId;
  });

  const handleDragEnd = $(() => {
    state.draggingProcess = null;
  });

  const handleDrop = $(async (targetStatus: ProcessStatus) => {
    if (!state.draggingProcess) return;
    
    const process = state.processes.find(p => p.id === state.draggingProcess);
    if (process && process.status !== targetStatus) {
      await updateProcessStatus(state.draggingProcess, targetStatus);
    }
    
    state.draggingProcess = null;
  });

  const handleDragOver = $((e: DragEvent) => {
    e.preventDefault();
  });

  return (
    <Layout>
      <div class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">修复工序</h1>
          <p class="text-gray-500 mt-1">管理和跟踪修复工序进度</p>
        </div>

        {state.error && (
          <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        {/* Filters */}
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="label">筛选古籍</label>
              <select
                class="input"
                value={state.filterBook}
                onChange$={(_, el) => state.filterBook = el.value}
              >
                <option value="">全部古籍</option>
                {state.books.map(book => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="label">工序状态</label>
              <select
                class="input"
                value={state.filterStatus}
                onChange$={(_, el) => state.filterStatus = el.value}
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="skipped">已跳过</option>
              </select>
            </div>
            <div>
              <button class="btn btn-primary">
                + 添加工序
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-4">工序看板（拖拽卡片更新状态）</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['pending', 'in_progress', 'completed', 'skipped'] as const).map(status => (
              <div 
                key={status}
                class={clsx(
                  'min-h-[400px] bg-gray-50 rounded-xl p-4 border-t-4 transition-all',
                  statusColors[status],
                  state.draggingProcess ? 'bg-antique-50 scale-[1.01]' : ''
                )}
                onDragOver$={handleDragOver}
                onDrop$={() => handleDrop(status)}
              >
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">{PROCESS_STATUS_LABELS[status]}</h3>
                  <span class="badge bg-gray-200">
                    {processesByStatus[status].length}
                  </span>
                </div>
                <div class="space-y-3">
                  {processesByStatus[status].length === 0 ? (
                    <p class="text-gray-400 text-center py-8 text-sm">
                      {state.draggingProcess ? '拖放到此处' : '暂无工序'}
                    </p>
                  ) : (
                    processesByStatus[status].map(process => (
                      <div
                        key={process.id}
                        draggable={true}
                        onDragStart$={() => handleDragStart(process.id)}
                        onDragEnd$={handleDragEnd}
                        class={clsx(
                          'p-4 bg-white rounded-lg shadow-sm border cursor-move hover:shadow-md transition-all select-none',
                          state.draggingProcess === process.id ? 'opacity-50 scale-105 shadow-lg' : ''
                        )}
                      >
                        <p class="font-medium mb-1 truncate">{process.name}</p>
                        <p class="text-xs text-gray-500 mb-2 truncate">
                          {getBookTitle(process.book_id)}
                        </p>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-500">
                            👤 {getUserName(process.assignee)}
                          </span>
                          {process.estimated_duration && (
                            <span class="text-gray-500">
                              ⏱️ {process.estimated_duration}分钟
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process List */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">工序列表</h2>
          {filteredProcesses.length === 0 ? (
            <Empty title="暂无工序记录" />
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">排序</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">工序名称</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">古籍</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">负责人</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">预计时长</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcesses.map((process, index) => (
                    <tr key={process.id} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 text-gray-500">{index + 1}</td>
                      <td class="py-3 px-4 font-medium">{process.name}</td>
                      <td class="py-3 px-4 text-gray-600">{getBookTitle(process.book_id)}</td>
                      <td class="py-3 px-4 text-gray-600">{getUserName(process.assignee)}</td>
                      <td class="py-3 px-4 text-gray-600">
                        {process.estimated_duration ? `${process.estimated_duration}分钟` : '-'}
                      </td>
                      <td class="py-3 px-4">
                        <StatusBadge status={process.status} type="process" />
                      </td>
                      <td class="py-3 px-4">
                        <button 
                          class="text-blue-600 hover:underline text-sm mr-2"
                          onClick$={async () => {
                            const nextStatus: Record<string, ProcessStatus> = {
                              pending: 'in_progress',
                              in_progress: 'completed',
                              completed: 'completed',
                              skipped: 'pending',
                            };
                            if (nextStatus[process.status] !== process.status) {
                              await updateProcessStatus(process.id, nextStatus[process.status]);
                            }
                          }}
                        >
                          推进
                        </button>
                        <button class="text-gray-600 hover:underline text-sm">
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});
