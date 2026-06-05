import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ stats, byCategory, byCarrier, anomalyReasons, completedRequests, avgProcessingTime }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    仪表盘
                </h2>
            }
        >
            <Head title="仪表盘" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm">危废批次总数</div>
                            <div className="text-3xl font-bold text-gray-800">{stats.total_batches}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm">待处理申请</div>
                            <div className="text-3xl font-bold text-yellow-600">{stats.pending_requests}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm">已放行</div>
                            <div className="text-3xl font-bold text-green-600">{stats.approved_requests}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-gray-500 text-sm">已退回</div>
                            <div className="text-3xl font-bold text-red-600">{stats.rejected_requests}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">按危废类别统计</h3>
                                <div className="space-y-4">
                                    {byCategory.map((category, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-700">{category.name}</div>
                                                <div className="text-sm text-gray-500">{category.code}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-800">{category.total_weight.toFixed(2)} kg</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">按承运商统计</h3>
                                <div className="space-y-4">
                                    {byCarrier.map((carrier, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-700 flex items-center">
                                                    {carrier.name}
                                                    {carrier.is_expired && (
                                                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                                            资质过期
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="font-bold text-gray-800">{carrier.total_requests} 单</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">异常原因统计</h3>
                                <div className="space-y-4">
                                    {anomalyReasons.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="font-medium text-gray-700">{item.reason}</div>
                                            <div className={`font-bold ${item.count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.count} 单
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">处理耗时统计</h3>
                                <div className="mb-4">
                                    <div className="text-gray-500 text-sm">平均处理耗时</div>
                                    <div className="text-3xl font-bold text-blue-600">{avgProcessingTime} 小时</div>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {completedRequests.map((request, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="text-gray-600">{request.request_number}</div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-gray-500">{request.processing_hours}h</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    request.status === '已放行' ? 'bg-green-100 text-green-700' :
                                                    request.status === '已退回' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
