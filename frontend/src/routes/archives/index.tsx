import { component$, useStore } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { ARCHIVE_TYPE_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Archive, Book, ArchiveStatistics } from '~/types';

export const useArchivesData = routeLoader$(async () => {
  try {
    const [archives, books, statistics] = await Promise.all([
      serverFetch<Archive[]>('/archives'),
      serverFetch<Book[]>('/books'),
      serverFetch<ArchiveStatistics>('/archives/statistics'),
    ]);
    return { archives, books, statistics };
  } catch (e) {
    return { 
      archives: [], 
      books: [], 
      statistics: {
        total_books: 0,
        total_archives: 0,
        image_count: 0,
        document_count: 0,
        record_count: 0,
        books_without_images: 0,
      }
    };
  }
});

export default component$(() => {
  const data = useArchivesData();
  const state = useStore({
    filterType: '',
    filterBook: '',
  });

  const getBookTitle = (bookId: string) => {
    return data.value.books.find(b => b.id === bookId)?.title || '未知古籍';
  };

  const filteredArchives = data.value.archives.filter(a => {
    const matchType = !state.filterType || a.type === state.filterType;
    const matchBook = !state.filterBook || a.book_id === state.filterBook;
    return matchType && matchBook;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">档案统计</h1>
          <p class="text-gray-500 mt-1">修复档案管理与统计分析</p>
        </div>

        {/* Statistics */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-3xl font-bold">{data.value.statistics.total_books}</p>
            <p class="text-sm text-gray-500 mt-1">古籍总数</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold">{data.value.statistics.total_archives}</p>
            <p class="text-sm text-gray-500 mt-1">档案总数</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold">{data.value.statistics.image_count}</p>
            <p class="text-sm text-gray-500 mt-1">影像资料</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-orange-600">{data.value.statistics.books_without_images}</p>
            <p class="text-sm text-gray-500 mt-1">缺失影像</p>
          </div>
        </div>

        {/* Type Distribution */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="card">
            <h2 class="text-lg font-semibold mb-4">档案类型分布</h2>
            <div class="space-y-3">
              {(['image', 'document', 'record', 'other'] as const).map(type => {
                const count = data.value.archives.filter(a => a.type === type).length;
                const percentage = data.value.statistics.total_archives > 0 
                  ? Math.round((count / data.value.statistics.total_archives) * 100) 
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
            {data.value.statistics.books_without_images === 0 ? (
              <Empty title="所有古籍均已归档影像资料" icon="✅" />
            ) : (
              <div class="space-y-2">
                <p class="text-sm text-yellow-800 mb-3">
                  共有 {data.value.statistics.books_without_images} 本古籍缺失影像档案，请及时补充
                </p>
                {data.value.books
                  .filter(book => !data.value.archives.some(a => a.book_id === book.id && a.type === 'image'))
                  .slice(0, 5)
                  .map(book => (
                    <div key={book.id} class="flex items-center justify-between p-2 bg-white rounded">
                      <span class="text-sm">{book.title}</span>
                      <button class="text-xs text-yellow-700 hover:underline">
                        上传影像
                      </button>
                    </div>
                  ))
                }
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
                {data.value.books.map(book => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
            </div>
            <div>
              <button class="btn btn-primary">
                + 上传档案
              </button>
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
                      <td class="py-3 px-4 text-gray-600">{formatFileSize(archive.file_size)}</td>
                      <td class="py-3 px-4 text-gray-500 text-sm">
                        {new Date(archive.uploaded_at).toLocaleDateString('zh-CN')}
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
      </div>
    </Layout>
  );
});
