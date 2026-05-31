import { component$, useStore, useTask$, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Loading } from '~/components/ui/loading';
import { Empty } from '~/components/ui/empty';
import { Modal } from '~/components/ui/modal';
import { StatusBadge } from '~/components/ui/status-badge';
import { fetchApi } from '~/utils/api';
import type { Book, User } from '~/types';

export const useBooksData = routeLoader$(async () => {
  try {
    const [books, users] = await Promise.all([
      fetchApi<Book[]>('/books'),
      fetchApi<User[]>('/users'),
    ]);
    return { books, users };
  } catch (e) {
    return { books: [], users: [] };
  }
});

export default component$(() => {
  const data = useBooksData();
  const state = useStore({
    isModalOpen: false,
    isLoading: false,
    filterStatus: '',
    filterDynasty: '',
    searchQuery: '',
    form: {
      title: '',
      author: '',
      dynasty: '',
      year: '',
      material: '',
      dimensions: '',
      page_count: '',
      location: '',
    },
  });

  const filteredBooks = data.value.books.filter(book => {
    const matchStatus = !state.filterStatus || book.status === state.filterStatus;
    const matchDynasty = !state.filterDynasty || book.dynasty?.includes(state.filterDynasty);
    const matchSearch = !state.searchQuery || 
      book.title.includes(state.searchQuery) ||
      book.author?.includes(state.searchQuery);
    return matchStatus && matchDynasty && matchSearch;
  });

  const handleSubmit = $(async () => {
    if (!state.form.title.trim()) {
      return;
    }

    state.isLoading = true;
    try {
      const librarian = data.value.users.find(u => u.role === 'librarian');
      await fetchApi('/books', {
        method: 'POST',
        body: JSON.stringify({
          ...state.form,
          page_count: state.form.page_count ? parseInt(state.form.page_count) : undefined,
          entered_by: librarian?.id || '',
        }),
      });
      state.isModalOpen = false;
      state.form = {
        title: '',
        author: '',
        dynasty: '',
        year: '',
        material: '',
        dimensions: '',
        page_count: '',
        location: '',
      };
      window.location.reload();
    } catch (e) {
      console.error('Failed to create book');
    } finally {
      state.isLoading = false;
    }
  });

  return (
    <Layout>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">古籍管理</h1>
            <p class="text-gray-500 mt-1">管理馆藏古籍信息</p>
          </div>
          <button 
            class="btn btn-primary"
            onClick$={() => state.isModalOpen = true}
          >
            + 古籍入库
          </button>
        </div>

        {/* Filters */}
        <div class="card mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="label">搜索</label>
              <input
                type="text"
                class="input"
                placeholder="搜索书名、作者..."
                value={state.searchQuery}
                onInput$={(_, el) => state.searchQuery = el.value}
              />
            </div>
            <div>
              <label class="label">状态</label>
              <select
                class="input"
                value={state.filterStatus}
                onChange$={(_, el) => state.filterStatus = el.value}
              >
                <option value="">全部状态</option>
                <option value="pending">待诊断</option>
                <option value="diagnosing">诊断中</option>
                <option value="scheduled">已排程</option>
                <option value="repairing">修复中</option>
                <option value="reviewing">复核中</option>
                <option value="completed">已完成</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div>
              <label class="label">朝代</label>
              <input
                type="text"
                class="input"
                placeholder="筛选朝代..."
                value={state.filterDynasty}
                onInput$={(_, el) => state.filterDynasty = el.value}
              />
            </div>
            <div class="flex items-end">
              <button 
                class="btn btn-secondary w-full"
                onClick$={() => {
                  state.searchQuery = '';
                  state.filterStatus = '';
                  state.filterDynasty = '';
                }}
              >
                重置筛选
              </button>
            </div>
          </div>
        </div>

        {/* Books List */}
        <div class="card">
          {filteredBooks.length === 0 ? (
            <Empty title="暂无古籍数据" description="点击右上角按钮添加古籍" />
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">书名</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">作者</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">朝代</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">材质</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">位置</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4">
                        <p class="font-medium">{book.title}</p>
                      </td>
                      <td class="py-3 px-4 text-gray-600">{book.author || '-'}</td>
                      <td class="py-3 px-4 text-gray-600">{book.dynasty || '-'}</td>
                      <td class="py-3 px-4 text-gray-600">{book.material || '-'}</td>
                      <td class="py-3 px-4 text-gray-600">{book.location || '-'}</td>
                      <td class="py-3 px-4">
                        <StatusBadge status={book.status} type="book" />
                      </td>
                      <td class="py-3 px-4">
                        <button class="text-antique-600 hover:underline text-sm mr-2">
                          查看
                        </button>
                        <button class="text-blue-600 hover:underline text-sm">
                          编辑
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
          title="古籍入库"
          size="lg"
        >
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="label">书名 <span class="text-red-500">*</span></label>
              <input
                type="text"
                class="input"
                placeholder="请输入书名"
                value={state.form.title}
                onInput$={(_, el) => state.form.title = el.value}
              />
            </div>
            <div>
              <label class="label">作者</label>
              <input
                type="text"
                class="input"
                placeholder="请输入作者"
                value={state.form.author}
                onInput$={(_, el) => state.form.author = el.value}
              />
            </div>
            <div>
              <label class="label">朝代</label>
              <input
                type="text"
                class="input"
                placeholder="如：宋代、明代"
                value={state.form.dynasty}
                onInput$={(_, el) => state.form.dynasty = el.value}
              />
            </div>
            <div>
              <label class="label">年份</label>
              <input
                type="text"
                class="input"
                placeholder="如：1086年"
                value={state.form.year}
                onInput$={(_, el) => state.form.year = el.value}
              />
            </div>
            <div>
              <label class="label">材质</label>
              <select
                class="input"
                value={state.form.material}
                onChange$={(_, el) => state.form.material = el.value}
              >
                <option value="">请选择材质</option>
                <option value="皮纸">皮纸</option>
                <option value="竹纸">竹纸</option>
                <option value="楮纸">楮纸</option>
                <option value="桑皮纸">桑皮纸</option>
                <option value="麻纸">麻纸</option>
                <option value="开化纸">开化纸</option>
              </select>
            </div>
            <div>
              <label class="label">尺寸</label>
              <input
                type="text"
                class="input"
                placeholder="如：52x32cm"
                value={state.form.dimensions}
                onInput$={(_, el) => state.form.dimensions = el.value}
              />
            </div>
            <div>
              <label class="label">页数</label>
              <input
                type="number"
                class="input"
                placeholder="请输入页数"
                value={state.form.page_count}
                onInput$={(_, el) => state.form.page_count = el.value}
              />
            </div>
            <div class="col-span-2">
              <label class="label">馆藏位置</label>
              <input
                type="text"
                class="input"
                placeholder="如：A区-01-03"
                value={state.form.location}
                onInput$={(_, el) => state.form.location = el.value}
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
              {state.isLoading ? <Loading size="sm" /> : '确认入库'}
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
});
