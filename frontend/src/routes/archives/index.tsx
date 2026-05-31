import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { Modal } from '~/components/ui/modal';
import { Loading } from '~/components/ui/loading';
import { ARCHIVE_TYPE_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Archive, Book, ArchiveStatistics, User } from '~/types';

export const useArchivesData = routeLoader$(async () => {
  try {
    const [archives, books, statistics, users] = await Promise.all([
      serverFetch<Archive[]>('/archives'),
      serverFetch<Book[]>('/books'),
      serverFetch<ArchiveStatistics>('/archives/statistics'),
      serverFetch<User[]>('/users'),
    ]);
    return { archives, books, statistics, users, success: true };
  } catch (e) {
    console.error('Failed to load archives data:', e);
    return { 
      archives: [], 
      books: [], 
      users: [],
      statistics: {
        total_books: 0,
        total_archives: 0,
        image_count: 0,
        document_count: 0,
        record_count: 0,
        books_without_images: 0,
      },
      success: false
    };
  }
});

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default component$(() => {
  const initialData = useArchivesData();
  const state = useStore({
    archives: [] as Archive[],
    books: [] as Book[],
    users: [] as User[],
    statistics: null as ArchiveStatistics | null,
    filterType: '',
    filterBook: '',
    isUploadModalOpen: false,
    isSubmitting: false,
    error: '',
    form: {
      book_id: '',
      type: 'image' as 'image' | 'document' | 'record' | 'other',
      title: '',
      file_path: '',
      description: '',
      uploaded_by: '',
    },
  });

  useVisibleTask$(() => {
    state.archives = initialData.value.archives;
    state.books = initialData.value.books;
    state.users = initialData.value.users;
    state.statistics = initialData.value.statistics;
  });

  const getBookTitle = (bookId: string) => {
    return state.books.find(b => b.id === bookId)?.title || '未知古籍';
  };

  const getUserName = (userId: string) => {
    return state.users.find(u => u.id === userId)?.name || '未知用户';
  };

  const filteredArchives = state.archives.filter(a => {
    const matchType = !state.filterType || a.type === state.filterType;
    const matchBook = !state.filterBook || a.book_id === state.filterBook;
    return matchType && matchBook;
  });

  const booksWithoutImages = state.books.filter(book => 
    !state.archives.some(a => a.book_id === book.id && a.type === 'image')
  );

  const openUploadModal = $((prefill?: { book_id: string; type: string }) => {
    state.form = {
      book_id: prefill?.book_id || '',
      type: (prefill?.type as any) || 'image',
      title: '',
      file_path: '',
      description: '',
      uploaded_by: '',
    };
    
    // 预填标题
    if (prefill?.book_id) {
      const book = state.books.find(b => b.id === prefill.book_id);
      if (book && prefill.type === 'image') {
        state.form.title = `${book.title} - 修复影像`;
      }
    }
    
    state.error = '';
    state.isUploadModalOpen = true;
  });

  const closeUploadModal = $(() => {
    state.isUploadModalOpen = false;
    state.form = {
      book_id: '',
      type: 'image',
      title: '',
      file_path: '',
      description: '',
      uploaded_by: '',
    };
    state.error = '';
  });

  const submitUpload = $(async () => {
    // 前端校验
    if (!state.form.book_id) {
      state.error = '请选择关联古籍';
      return;
    }
    if (!state.form.title.trim()) {
      state.error = '请填写档案标题';
      return;
    }
    if (!state.form.uploaded_by) {
      state.error = '请选择上传人';
      return;
    }
    if (!state.form.file_path.trim() && !state.form.description.trim()) {
      state.error = '请填写文件路径或影像说明';
      return;
    }

    state.isSubmitting = true;
    state.error = '';

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/archives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id: state.form.book_id,
          title: state.form.title,
          type: state.form.type,
          file_path: state.form.file_path || null,
          file_size: null,
          description: state.form.description || null,
          uploaded_by: state.form.uploaded_by,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        state.error = errorData.error || `上传失败（${response.status}）`;
        state.isSubmitting = false;
        return;
      }

      // 刷新所有数据
      const [archives, statistics] = await Promise.all([
        fetchApi<Archive[]>('/archives'),
        fetchApi<ArchiveStatistics>('/archives/statistics'),
      ]);
      state.archives = archives;
      state.statistics = statistics;

      closeUploadModal();
    } catch (e: any) {
      state.error = e.message || '网络错误，请重试';
    } finally {
      state.isSubmitting = false;
    }
  });

  return (
    <Layout>
      <div class="p-6">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">档案统计</h1>
            <p class="text-gray-500 mt-1">修复档案管理与统计分析</p>
          </div>
          <button class="btn btn-primary" onClick$={() => openUploadModal()}>
            + 上传档案
          </button>
        </div>

        {/* Statistics */}
        {state.statistics && (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="card text-center">
              <p class="text-3xl font-bold">{state.statistics.total_books}</p>
              <p class="text-sm text-gray-500 mt-1">古籍总数</p>
            </div>
            <div class="card text-center">
              <p class="text-3xl font-bold">{state.statistics.total_archives}</p>
              <p class="text-sm text-gray-500 mt-1">档案总数</p>
            </div>
            <div class="card text-center">
              <p class="text-3xl font-bold">{state.statistics.image_count}</p>
              <p class="text-sm text-gray-500 mt-1">影像资料</p>
            </div>
            <div class="card text-center">
              <p class="text-3xl font-bold text-orange-600">{state.statistics.books_without_images}</p>
              <p class="text-sm text-gray-500 mt-1">缺失影像</p>
            </div>
          </div>
        )}

        {/* Type Distribution */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="card">
            <h2 class="text-lg font-semibold mb-4">档案类型分布</h2>
            <div class="space-y-3">
              {(['image', 'document', 'record', 'other'] as const).map(type => {
                const count = state.archives.filter(a => a.type === type).length;
                const percentage = state.statistics && state.statistics.total_archives > 0 
                  ? Math.round((count / state.statistics.total_archives) * 100) 
                  : 0;
                const colors: Record<string, string> = {
                  image: 'bg-blue-500',
                  document: 'bg-green-500',
                  record: 'bg-purple-500',
                  other: 'bg-gray-400',
                };
                return (
                  <div key={type}>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm">{ARCHIVE_TYPE_LABELS[type]}</span>
                      <span class="text-sm text-gray-500">{count} 件 ({percentage}%)</span>
                    </div>
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        class={`h-full ${colors[type]} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div class="card bg-yellow-50 border-yellow-200">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚠️</span>
              待补充影像资料
            </h2>
            {booksWithoutImages.length === 0 ? (
              <Empty title="所有古籍均已归档影像资料" icon="✅" />
            ) : (
              <div class="space-y-2">
                <p class="text-sm text-yellow-800 mb-3">
                  共有 {booksWithoutImages.length} 本古籍缺失影像档案，请及时补充
                </p>
                {booksWithoutImages.slice(0, 5).map(book => (
                  <div key={book.id} class="flex items-center justify-between p-2 bg-white rounded">
                    <span class="text-sm font-medium">{book.title}</span>
                    <button 
                      class="text-xs text-yellow-700 hover:text-yellow-900 hover:underline font-medium"
                      onClick$={() => openUploadModal({ book_id: book.id, type: 'image' })}
                    >
                      上传影像
                    </button>
                  </div>
                ))}
                {booksWithoutImages.length > 5 && (
                  <p class="text-xs text-yellow-700 text-center pt-2">
                    还有 {booksWithoutImages.length - 5} 本古籍待补充影像
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="label">档案类型</label>
              <select
                class="input"
                value={state.filterType}
                onChange$={(_, el) => state.filterType = el.value}
              >
                <option value="">全部类型</option>
                <option value="image">影像资料</option>
                <option value="document">文档</option>
                <option value="record">修复记录</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="label">关联古籍</label>
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
          </div>
        </div>

        {/* Archives List */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">档案列表</h2>
          {filteredArchives.length === 0 ? (
            <Empty title="暂无档案记录" />
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">档案名称</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">类型</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">关联古籍</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">上传人</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">文件大小</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">上传时间</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchives.map(archive => (
                    <tr key={archive.id} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium">{archive.title}</td>
                      <td class="py-3 px-4">
                        <span class="badge bg-gray-100">
                          {ARCHIVE_TYPE_LABELS[archive.type]}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-gray-600">{getBookTitle(archive.book_id)}</td>
                      <td class="py-3 px-4 text-gray-600">{getUserName(archive.uploaded_by)}</td>
                      <td class="py-3 px-4 text-gray-600">{formatFileSize(archive.file_size)}</td>
                      <td class="py-3 px-4 text-gray-500 text-sm">
                        {formatDateTime(archive.uploaded_at)}
                      </td>
                      <td class="py-3 px-4">
                        <button class="text-blue-600 hover:underline text-sm mr-2">
                          查看
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

        {/* Upload Modal */}
        <Modal
          isOpen={state.isUploadModalOpen}
          onClose$={closeUploadModal}
          title="上传档案"
          size="lg"
        >
          <div>
            {/* Error */}
            {state.error && (
              <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {state.error}
              </div>
            )}

            {/* Form */}
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">关联古籍 <span class="text-red-500">*</span></label>
                  <select
                    class="input"
                    value={state.form.book_id}
                    onChange$={(_, el) => state.form.book_id = el.value}
                  >
                    <option value="">请选择古籍</option>
                    {state.books.map(book => (
                      <option key={book.id} value={book.id}>{book.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="label">档案类型 <span class="text-red-500">*</span></label>
                  <select
                    class="input"
                    value={state.form.type}
                    onChange$={(_, el) => state.form.type = el.value as any}
                  >
                    <option value="image">影像资料</option>
                    <option value="document">文档</option>
                    <option value="record">修复记录</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label">档案标题 <span class="text-red-500">*</span></label>
                <input
                  type="text"
                  class="input"
                  placeholder="如：《永乐大典》卷一千二百三十六 - 修复前影像"
                  value={state.form.title}
                  onInput$={(_, el) => state.form.title = el.value}
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">文件路径</label>
                  <input
                    type="text"
                    class="input"
                    placeholder="/archives/2024/01/image_001.jpg"
                    value={state.form.file_path}
                    onInput$={(_, el) => state.form.file_path = el.value}
                  />
                </div>

                <div>
                  <label class="label">上传人 <span class="text-red-500">*</span></label>
                  <select
                    class="input"
                    value={state.form.uploaded_by}
                    onChange$={(_, el) => state.form.uploaded_by = el.value}
                  >
                    <option value="">请选择上传人</option>
                    {state.users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label class="label">影像说明 / 备注</label>
                <textarea
                  class="input min-h-[80px]"
                  placeholder="请填写影像内容描述、修复部位说明等信息..."
                  value={state.form.description}
                  onInput$={(_, el) => state.form.description = el.value}
                />
                <p class="text-xs text-gray-500 mt-1">
                  文件路径和影像说明至少填写一项
                </p>
              </div>
            </div>

            {/* Actions */}
            <div class="flex justify-end gap-3 mt-6">
              <button 
                class="btn btn-secondary"
                onClick$={closeUploadModal}
                disabled={state.isSubmitting}
              >
                取消
              </button>
              <button 
                class="btn btn-primary"
                onClick$={submitUpload}
                disabled={state.isSubmitting}
              >
                {state.isSubmitting ? <Loading size="sm" /> : '确认上传'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
});
