import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ transferRequest }) {
    const { data, setData, post, processing, errors } = useForm({
        transfer_request_id: transferRequest.id,
        manifest_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        manifest_document: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('manifest-forms.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        上传联单信息
                    </h2>
                    <Link
                        href={route('transfer-requests.show', transferRequest.id)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                        返回申请详情
                    </Link>
                </div>
            }
        >
            <Head title="上传联单信息" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                转运申请: {transferRequest.request_number}
                            </h3>
                            <p className="text-sm text-gray-500">
                                危废类别: {transferRequest.waste_batch.waste_category.name} | 
                                重量: {transferRequest.waste_batch.weight} kg
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    联单号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.manifest_number}
                                    onChange={(e) => setData('manifest_number', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="请输入联单号"
                                    required
                                />
                                {errors.manifest_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.manifest_number}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    签发日期 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.issue_date}
                                    onChange={(e) => setData('issue_date', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                                {errors.issue_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.issue_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    联单文件名称
                                </label>
                                <input
                                    type="text"
                                    value={data.manifest_document}
                                    onChange={(e) => setData('manifest_document', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="如：联单扫描件_20240101.pdf"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    请填写联单文件的名称，用于记录和追踪
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                                <Link
                                    href={route('transfer-requests.show', transferRequest.id)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium disabled:opacity-50"
                                >
                                    提交联单
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
