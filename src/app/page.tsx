import Link from 'next/link';
import { mockPickupRecords, mockChildren, mockAuthorizations } from '@/lib/mockData';
import { PickupStatusMap, ExceptionReasonMap } from '@/types';

export default function Home() {
  const todayRecords = mockPickupRecords.filter(r => {
    const recordDate = new Date(r.pickupDate).toDateString();
    const today = new Date('2025-06-07').toDateString();
    return recordDate === today;
  });

  const pendingCount = mockPickupRecords.filter(r => r.status === 'PENDING').length;
  const blockedCount = mockPickupRecords.filter(r => r.status === 'BLOCKED').length;
  const exceptionCount = mockPickupRecords.filter(
    r => r.status === 'EXCEPTION_APPROVED' || r.status === 'EXCEPTION_REJECTED'
  ).length;

  const quickActions = [
    {
      href: '/teacher',
      title: '班主任授权管理',
      description: '登记、变更幼儿接送授权信息',
      icon: '👩‍🏫',
      color: 'from-blue-500 to-blue-600',
    },
    {
      href: '/guard',
      title: '门岗身份核验',
      description: '核验接送人身份，处理异常情况',
      icon: '🚪',
      color: 'from-green-500 to-green-600',
    },
    {
      href: '/principal',
      title: '园长异常复核',
      description: '复核异常放行申请，做出最终决定',
      icon: '👨‍💼',
      color: 'from-purple-500 to-purple-600',
    },
    {
      href: '/records',
      title: '接送记录查询',
      description: '查看所有接送记录及详细信息',
      icon: '📋',
      color: 'from-orange-500 to-orange-600',
    },
    {
      href: '/statistics',
      title: '数据统计分析',
      description: '按班级、授权类型、异常原因统计',
      icon: '📊',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const recentRecords = mockPickupRecords
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          幼儿园接送管理系统
        </h1>
        <p className="text-gray-600">
          授权变更 · 身份核验 · 异常放行 · 全程追溯
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">在园幼儿</p>
              <p className="text-3xl font-bold text-gray-900">{mockChildren.length}</p>
            </div>
            <div className="text-4xl">👶</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">授权人数</p>
              <p className="text-3xl font-bold text-gray-900">{mockAuthorizations.length}</p>
            </div>
            <div className="text-4xl">👤</div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">待核验</p>
              <p className="text-3xl font-bold text-yellow-800">{pendingCount}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">异常记录</p>
              <p className="text-3xl font-bold text-red-800">{blockedCount + exceptionCount}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">快速入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group"
            >
              <div className={`bg-gradient-to-br ${action.color} rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1`}>
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                <p className="text-sm text-white/80">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最近接送记录</h2>
          <div className="space-y-3">
            {recentRecords.map((record) => {
              const child = mockChildren.find(c => c.id === record.childId);
              return (
                <Link
                  key={record.id}
                  href={`/records/${record.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👶</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{child?.name || '未知'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.pickupDate).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'VERIFIED' || record.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : record.status === 'BLOCKED'
                      ? 'bg-red-100 text-red-700'
                      : record.status === 'EXCEPTION_APPROVED'
                      ? 'bg-orange-100 text-orange-700'
                      : record.status === 'EXCEPTION_REJECTED'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {PickupStatusMap[record.status]}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/records"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            查看全部记录 →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">系统说明</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-1">🔄 授权变更流程</h3>
              <p className="text-sm text-blue-700">
                班主任登记授权信息 → 系统生成授权记录 → 门岗核验身份 → 正常/异常处理
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-1">✅ 正常接送</h3>
              <p className="text-sm text-green-700">
                授权人持有效证件，信息匹配无误，门岗核验通过后放行
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-900 mb-1">🚫 证件不符</h3>
              <p className="text-sm text-red-700">
                证件信息与系统登记不符时，必须阻断放行，并提示联系主监护人
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-medium text-orange-900 mb-1">👨‍💼 异常放行</h3>
              <p className="text-sm text-orange-700">
                存在争议或特殊情况时，需园长复核决定是否放行
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
