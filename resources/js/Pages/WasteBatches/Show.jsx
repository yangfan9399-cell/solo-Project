import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ batch }) {
    const getStatusColor = (status) => {
        const colors = {
            stored: 'bg-blue-100 text-blue-800',
            requested: 'bg-yellow-100 text-yellow-800',
            manifest_verified: 'bg-purple-100 text-purple-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        危废批次详情
                    </h2>
                    <Link
                        href={route('waste-batches.index')}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                        返回列表
                    </Link>
                </div>
            }
        >
            <Head title={`危废批次 ${batch.batch_number}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {batch.batch_number}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        登记人: {batch.created_by.name} | 登记时间: {batch.created_at}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                                    {batch.status_label}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-4">基本信息</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">危废类别</span>
                                        <span className="font-medium">{batch.waste_category.name} ({batch.waste_category.code})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">危险特性</span>
                                        <span className="font-medium">{batch.waste_category.hazard_code || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">重量</span>
                                        <span className="font-medium">{batch.weight} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">类别限制</span>
                                        <span className="font-medium">{batch.waste_category.max_weight_per_batch} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">产生日期</span>
                                        <span className="font-medium">{batch.production_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">暂存位置</span>
                                        <span className="font-medium">{batch.storage_location.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-4">备注说明</h4>
                                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                                    {batch.description || '暂无备注'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {batch.transfer_request && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">转运申请信息</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">申请单号</span>
                                        <Link href={route('transfer-requests.show', batch.transfer_request.id)} className="font-medium text-indigo-600 hover:text-indigo-900">
                                            {batch.transfer_request.request_number}
                                        </Link>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">承运单位</span>
                                        <span className="font-medium">{batch.transfer_request.carrier.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">计划转运日期</span>
                                        <span className="font-medium">{batch.transfer_request.planned_transfer_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">目的地</span>
                                        <span className="font-medium">{batch.transfer_request.destination}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">接收单位</span>
                                        <span className="font-medium">{batch.transfer_request.receiver_unit}</span>
                                    </div>
                                </div>
                                <div>
                                    {batch.transfer_request.is_weight_over_limit && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="font-medium text-yellow-800 mb-1">⚠️ 重量超限提醒</div>
                                            <p className="text-sm text-yellow-700">{batch.transfer_request.weight_remark}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">处理历史</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {batch.process_histories.map((history, index) => (
                                    <div key={history.id} className="flex">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                            {index < batch.process_histories.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-800">{history.action}</span>
                                                <span className="text-sm text-gray-500">{history.created_at}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{history.remark}</p>
                                            <p className="text-xs text-gray-400 mt-1">操作人: {history.performed_by.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
