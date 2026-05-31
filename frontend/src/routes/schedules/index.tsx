import { component$, useStore, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { Modal } from '~/components/ui/modal';
import { Loading } from '~/components/ui/loading';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Schedule, Book, User, ScheduleConflict } from '~/types';

export const useSchedulesData = routeLoader$(async () => {
  try {
    const [schedules, books, users] = await Promise.all([
      serverFetch<Schedule[]>('/schedules'),
      serverFetch<Book[]>('/books'),
      serverFetch<User[]>('/users'),
    ]);
    return { schedules, books, users };
  } catch (e) {
    return { schedules: [], books: [], users: [] };
  }
});

export default component$(() => {
  const data = useSchedulesData();
  const state = useStore({
    filterRestorer: '',
    isModalOpen: false,
    isLoading: false,
    conflicts: [] as ScheduleConflict[],
    form: {
      book_id: '',
      restorer_id: '',
      start_time: '',
      end_time: '',
      description: '',
    },
  });

  const getBookTitle = (bookId: string) => {
    return data.value.books.find(b => b.id === bookId)?.title || '未知古籍';
  };

  const getUserName = (userId: string) => {
    return data.value.users.find(u => u.id === userId)?.name || '未知用户';
  };

  const restorers = data.value.users.filter(u => u.role === 'restorer');

  const filteredSchedules = data.value.schedules.filter(s => {
    const matchRestorer = !state.filterRestorer || s.restorer_id === state.filterRestorer;
    return matchRestorer;
  });

  const checkConflicts = $(async () => {
    if (!state.form.restorer_id || !state.form.start_time || !state.form.end_time) {
      return;
    }
    
    try {
      const conflicts = await fetchApi<ScheduleConflict[]>(
        `/schedules/conflicts?restorer_id=${state.form.restorer_id}&start_time=${state.form.start_time}&end_time=${state.form.end_time}`
      );
      state.conflicts = conflicts;
    } catch (e) {
      state.conflicts = [];
    }
  });

  const handleSubmit = $(async () => {
    if (!state.form.book_id || !state.form.restorer_id || !state.form.start_time || !state.form.end_time) {
      return;
    }

    state.isLoading = true;
    try {
      await fetchApi('/schedules', {
        method: 'POST',
        body: JSON.stringify(state.form),
      });
      state.isModalOpen = false;
      window.location.reload();
    } catch (e) {
      console.error('Failed to create schedule');
    } finally {
      state.isLoading = false;
    }
  });

  return (
    <Layout>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">排程管理</h1>
            <p class="text-gray-500 mt-1">修复任务排程与冲突检测</p>
          </div>
          <button 
            class="btn btn-primary"
            onClick$={() => state.isModalOpen = true}
          >
            + 新建排程
          </button>
        </div>

        {/* Filters */}
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="label">修复师</label>
              <select
                class="input"
                value={state.filterRestorer}
                onChange$={(_, el) => state.filterRestorer = el.value}
              >
                <option value="">全部修复师</option>
                {restorers.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4">排程时间线</h2>
          {filteredSchedules.length === 0 ? (
            <Empty title="暂无排程" />
          ) : (
            <div class="space-y-4">
              {restorers.map(restorer => {
                const restorerSchedules = filteredSchedules.filter(s => s.restorer_id === restorer.id);
                if (restorerSchedules.length === 0) return null;
                
                return (
                  <div key={restorer.id} class="p-4 bg-gray-50 rounded-lg">
                    <h3 class="font-medium mb-3">{restorer.name}</h3>
                    <div class="space-y-2">
                      {restorerSchedules.map(schedule => (
                        <div 
                          key={schedule.id}
                          class="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-antique-400 transition-colors"
                        >
                          <div class="text-sm text-gray-500 w-48">
                            <p>{new Date(schedule.start_time).toLocaleString('zh-CN')}</p>
                            <p>至 {new Date(schedule.end_time).toLocaleTimeString('zh-CN')}</p>
                          </div>
                          <div class="flex-1">
                            <p class="font-medium">{getBookTitle(schedule.book_id)}</p>
                            {schedule.description && (
                              <p class="text-sm text-gray-500">{schedule.description}</p>
                            )}
                          </div>
                          <div class="flex gap-2">
                            <button class="text-blue-600 hover:underline text-sm">编辑</button>
                            <button class="text-red-600 hover:underline text-sm">删除</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Schedule List */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">排程列表</h2>
          {filteredSchedules.length === 0 ? (
            <Empty title="暂无排程记录" />
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">古籍</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">修复师</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">开始时间</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">结束时间</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map(schedule => (
                    <tr key={schedule.id} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium">{getBookTitle(schedule.book_id)}</td>
                      <td class="py-3 px-4">{getUserName(schedule.restorer_id)}</td>
                      <td class="py-3 px-4 text-gray-600">
                        {new Date(schedule.start_time).toLocaleString('zh-CN')}
                      </td>
                      <td class="py-3 px-4 text-gray-600">
                        {new Date(schedule.end_time).toLocaleString('zh-CN')}
                      </td>
                      <td class="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {schedule.description || '-'}
                      </td>
                      <td class="py-3 px-4">
                        <button class="text-blue-600 hover:underline text-sm mr-2">
                          编辑
                        </button>
                        <button class="text-red-600 hover:underline text-sm">
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

        {/* Create Modal */}
        <Modal
          isOpen={state.isModalOpen}
          onClose$={() => state.isModalOpen = false}
          title="新建排程"
          size="lg"
        >
          <div class="space-y-4">
            <div>
              <label class="label">选择古籍 <span class="text-red-500">*</span></label>
              <select
                class="input"
                value={state.form.book_id}
                onChange$={(_, el) => state.form.book_id = el.value}
              >
                <option value="">请选择古籍</option>
                {data.value.books
                  .filter(b => b.status !== 'completed' && b.status !== 'archived')
                  .map(book => (
                    <option key={book.id} value={book.id}>{book.title}</option>
                  ))
                }
              </select>
            </div>
            <div>
              <label class="label">修复师 <span class="text-red-500">*</span></label>
              <select
                class="input"
                value={state.form.restorer_id}
                onChange$={(e, el) => {
                  state.form.restorer_id = el.value;
                  checkConflicts();
                }}
              >
                <option value="">请选择修复师</option>
                {restorers.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">开始时间 <span class="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  class="input"
                  value={state.form.start_time}
                  onInput$={(e, el) => {
                    state.form.start_time = el.value;
                    checkConflicts();
                  }}
                />
              </div>
              <div>
                <label class="label">结束时间 <span class="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  class="input"
                  value={state.form.end_time}
                  onInput$={(e, el) => {
                    state.form.end_time = el.value;
                    checkConflicts();
                  }}
                />
              </div>
            </div>

            {/* Conflict Warning */}
            {state.conflicts.length > 0 && (
              <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-700 font-medium mb-2">⚠️ 检测到排程冲突</p>
                <ul class="text-sm text-red-600 space-y-1">
                  {state.conflicts.map(conflict => (
                    <li key={conflict.schedule_id}>
                      • {conflict.book_title} ({new Date(conflict.start_time).toLocaleString('zh-CN')} - {new Date(conflict.end_time).toLocaleTimeString('zh-CN')})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label class="label">排程描述</label>
              <textarea
                class="input min-h-[80px]"
                placeholder="请输入排程描述..."
                value={state.form.description}
                onInput$={(_, el) => state.form.description = el.value}
              />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button 
              class="btn btn-secondary"
              onClick$={() => state.isModalOpen = false}
            >
              取消
            </button>
            <button 
              class="btn btn-primary"
              onClick$={handleSubmit}
              disabled={state.isLoading}
            >
              {state.isLoading ? <Loading size="sm" /> : '创建排程'}
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
});
