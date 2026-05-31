import { component$, useContext, useStore, useTask$ } from '@builder.io/qwik';
import { Link, routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Loading, PageLoading } from '~/components/ui/loading';
import { Empty } from '~/components/ui/empty';
import { StatusBadge } from '~/components/ui/status-badge';
import { AppStore, BOOK_STATUS_LABELS, DISEASE_SEVERITY_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Book, Disease, Material } from '~/types';

export const useDashboardData = routeLoader$(async () => {
  try {
    const [books, diseases, materials] = await Promise.all([
      serverFetch<Book[]>('/books'),
      serverFetch<Disease[]>('/diseases'),
      serverFetch<Material[]>('/materials/low-stock'),
    ]);
    return { books, diseases, materials };
  } catch (e) {
    return { books: [], diseases: [], materials: [] };
  }
});

export default component$(() => {
  const store = useContext(AppStore);
  const data = useDashboardData();

  const stats = useStore({
    totalBooks: 0,
    pendingBooks: 0,
    repairingBooks: 0,
    completedBooks: 0,
    criticalDiseases: 0,
    severeDiseases: 0,
    lowStockMaterials: 0,
  });

  useTask$(({ track }) => {
    track(() => data.value);
    
    const { books, diseases, materials } = data.value;
    stats.totalBooks = books.length;
    stats.pendingBooks = books.filter(b => b.status === 'pending' || b.status === 'diagnosing').length;
    stats.repairingBooks = books.filter(b => b.status === 'repairing' || b.status === 'scheduled').length;
    stats.completedBooks = books.filter(b => b.status === 'completed').length;
    stats.criticalDiseases = diseases.filter(d => d.severity === 'critical').length;
    stats.severeDiseases = diseases.filter(d => d.severity === 'severe').length;
    stats.lowStockMaterials = materials.length;
  });

  if (!store.currentUser) {
    return (
      <Layout>
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <span class="text-6xl block mb-4">📜</span>
            <h1 class="text-3xl font-bold text-antique-900 mb-2">欢迎使用古籍修复馆系统</h1>
            <p class="text-gray-500 mb-6">请先登录以访问系统功能</p>
            <Link href="/login" class="btn btn-primary inline-block">
              立即登录
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">工作台</h1>
          <p class="text-gray-500 mt-1">欢迎回来，{store.currentUser.name}</p>
        </div>

        {/* Stats Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">古籍总数</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{stats.totalBooks}</p>
              </div>
              <span class="text-4xl">📚</span>
            </div>
          </div>
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">待修复</p>
                <p class="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingBooks}</p>
              </div>
              <span class="text-4xl">⏳</span>
            </div>
          </div>
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">修复中</p>
                <p class="text-3xl font-bold text-blue-600 mt-1">{stats.repairingBooks}</p>
              </div>
              <span class="text-4xl">🔧</span>
            </div>
          </div>
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">已完成</p>
                <p class="text-3xl font-bold text-green-600 mt-1">{stats.completedBooks}</p>
              </div>
              <span class="text-4xl">✅</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(stats.criticalDiseases > 0 || stats.lowStockMaterials > 0) && (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stats.criticalDiseases > 0 && (
              <div class="card border-l-4 border-l-red-500 bg-red-50">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">⚠️</span>
                  <div>
                    <h3 class="font-semibold text-red-800">危重病害预警</h3>
                    <p class="text-red-600 text-sm mt-1">
                      检测到 {stats.criticalDiseases} 例危重病害，{stats.severeDiseases} 例重度病害，需优先处理
                    </p>
                    <Link href="/diseases" class="text-red-700 text-sm underline mt-2 inline-block">
                      查看病害详情 →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {stats.lowStockMaterials > 0 && (
              <div class="card border-l-4 border-l-orange-500 bg-orange-50">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">📦</span>
                  <div>
                    <h3 class="font-semibold text-orange-800">材料库存预警</h3>
                    <p class="text-orange-600 text-sm mt-1">
                      有 {stats.lowStockMaterials} 种材料库存不足，请及时补充
                    </p>
                    <Link href="/materials" class="text-orange-700 text-sm underline mt-2 inline-block">
                      查看材料库存 →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disease Severity Board */}
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4">病害等级看板</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['mild', 'moderate', 'severe', 'critical'].map(severity => {
              const count = data.value.diseases.filter(d => d.severity === severity).length;
              const colors: Record<string, string> = {
                mild: 'bg-green-100 border-green-300',
                moderate: 'bg-yellow-100 border-yellow-300',
                severe: 'bg-orange-100 border-orange-300',
                critical: 'bg-red-100 border-red-300',
              };
              return (
                <div key={severity} class={`p-4 rounded-lg border-2 ${colors[severity]} text-center`}>
                  <p class="text-3xl font-bold">{count}</p>
                  <p class="text-sm mt-1">{DISEASE_SEVERITY_LABELS[severity]}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Books */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">最新古籍</h2>
              <Link href="/books" class="text-antique-600 text-sm hover:underline">
                查看全部 →
              </Link>
            </div>
            {data.value.books.length === 0 ? (
              <Empty title="暂无古籍数据" />
            ) : (
              <div class="space-y-3">
                {data.value.books.slice(0, 5).map(book => (
                  <div key={book.id} class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p class="font-medium">{book.title}</p>
                      <p class="text-sm text-gray-500">{book.dynasty || '未知朝代'}</p>
                    </div>
                    <StatusBadge status={book.status} type="book" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">库存预警材料</h2>
              <Link href="/materials" class="text-antique-600 text-sm hover:underline">
                查看全部 →
              </Link>
            </div>
            {data.value.materials.length === 0 ? (
              <Empty title="库存充足，暂无预警" icon="✅" />
            ) : (
              <div class="space-y-3">
                {data.value.materials.slice(0, 5).map(material => (
                  <div key={material.id} class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p class="font-medium">{material.name}</p>
                      <p class="text-sm text-red-600">
                        当前库存：{material.stock_quantity} {material.unit} / 最低：{material.min_stock} {material.unit}
                      </p>
                    </div>
                    <span class="text-red-500 text-sm">库存不足</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
});
