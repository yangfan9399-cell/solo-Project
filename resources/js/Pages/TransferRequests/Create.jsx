import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ batches, carriers }) {
    const { data, setData, post, processing, errors } = useForm({
        waste_batch_id: '',
        carrier_id: '',
        planned_transfer_date: new Date().toISOString().split('T')[0],
        destination: '',
        receiver_unit: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('transfer-requests.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    提交转运申请
                </h2>
            }
        >
            <Head title="提交转运申请" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    选择危废批次
                                </label>
                                <select
                                    value={data.waste_batch_id}
                                    onChange={(e) => setData('waste_batch_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">请选择待转运的危废批次</option>
                                    {batches.map((batch) => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.batch_number} - {batch.waste_category.name} ({batch.weight} kg)
                                        </option>
                                    ))}
                                </select>
                                {errors.waste_batch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.waste_batch_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    选择承运单位
                                </label>
                                <select
                                    value={data.carrier_id}
                                    onChange={(e) => setData('carrier_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">请选择承运单位</option>
                                    {carriers.map((carrier) => {
                                        const isExpired = new Date(carrier.qualification_expiry_date) < new Date();
                                        return (
                                            <option key={carrier.id} value={carrier.id} disabled={isExpired}>
                                                {carrier.name} {isExpired ? '(资质过期)' : `(有效期至: ${carrier.qualification_expiry_date})`}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.carrier_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.carrier_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    计划转运日期
                                </label>
                                <input
                                    type="date"
                                    value={data.planned_transfer_date}
                                    onChange={(e) => setData('planned_transfer_date', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.planned_transfer_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.planned_transfer_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    目的地
                                </label>
                                <input
                                    type="text"
                                    value={data.destination}
                                    onChange={(e) => setData('destination', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="请输入目的地"
                                />
                                {errors.destination && (
                                    <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    接收单位
                                </label>
                                <input
                                    type="text"
                                    value={data.receiver_unit}
                                    onChange={(e) => setData('receiver_unit', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="请输入接收单位名称"
                                />
                                {errors.receiver_unit && (
                                    <p className="mt-1 text-sm text-red-600">{errors.receiver_unit}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-4">
                                <Link
                                    href={route('transfer-requests.index')}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    提交申请
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
