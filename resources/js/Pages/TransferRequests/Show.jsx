import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';

export default function Show({ request, carriers }) {
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showManifestModal, setShowManifestModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showChangeCarrierModal, setShowChangeCarrierModal] = useState(false);

    const isCarrierExpired = new Date(request.carrier.qualification_expiry_date) < new Date();

    const { data: reviewData, setData: setReviewData, post: postReview, processing: reviewProcessing } = useForm({
        transfer_request_id: request.id,
        result: isCarrierExpired ? 'rejected' : 'approved',
        review_remark: '',
    });

    const { data: manifestData, setData: setManifestData, post: postManifest, processing: manifestProcessing, errors: manifestErrors } = useForm({
        transfer_request_id: request.id,
        manifest_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        manifest_document: '',
    });

    const { data: verifyData, setData: setVerifyData, post: postVerify, processing: verifyProcessing } = useForm({
        status: 'verified',
        verification_remark: '',
    });

    const { data: carrierData, setData: setCarrierData, post: postCarrier, processing: carrierProcessing } = useForm({
        carrier_id: '',
    });

    useEffect(() => {
        if (isCarrierExpired && reviewData.result === 'approved') {
            setReviewData('result', 'rejected');
        }
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
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
                        转运申请详情
                    </h2>
                    <Link
                        href={route('transfer-requests.index')}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                        返回列表
                    </Link>
                </div>
            }
        >
            <Head title={`转运申请 ${request.request_number}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {isCarrierExpired && (
                        <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-orange-700 font-medium">
                                        ⚠️ 承运单位资质已过期，禁止放行！
                                    </p>
                                    <p className="text-orange-600 text-sm mt-1">
                                        当前申请可选择退回或归档。如需放行，请先更换为有效资质的承运单位。
                                    </p>
                                    {request.status === 'manifest_verified' && !request.review && (
                                        <button
                                            onClick={() => setShowChangeCarrierModal(true)}
                                            className="mt-2 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 font-medium"
                                        >
                                            更换承运单位
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {request.request_number}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        申请人: {request.created_by.name} | 申请时间: {request.created_at}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                    {request.status_label}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-4">危废信息</h4>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">批次号</span>
                                        <Link href={route('waste-batches.show', request.waste_batch.id)} className="font-medium text-indigo-600">
                                            {request.waste_batch.batch_number}
                                        </Link>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">危废类别</span>
                                        <span className="font-medium">{request.waste_batch.waste_category.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">类别代码</span>
                                        <span className="font-medium">{request.waste_batch.waste_category.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">重量</span>
                                        <span className="font-medium">{request.waste_batch.weight} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">类别限制</span>
                                        <span className="font-medium">{request.waste_batch.waste_category.max_weight_per_batch} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">暂存位置</span>
                                        <span className="font-medium">{request.waste_batch.storage_location.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-4">转运信息</h4>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">承运单位</span>
                                        <span className="font-medium">{request.carrier.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">资质有效期</span>
                                        <span className={`font-medium ${isCarrierExpired ? 'text-red-600' : ''}`}>
                                            {request.carrier.qualification_expiry_date}
                                            {isCarrierExpired && ' (已过期)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">计划转运日期</span>
                                        <span className="font-medium">{request.planned_transfer_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">目的地</span>
                                        <span className="font-medium">{request.destination}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">接收单位</span>
                                        <span className="font-medium">{request.receiver_unit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <div className="flex flex-wrap gap-4">
                                {request.is_weight_over_limit && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                                        <span className="text-yellow-700 font-medium">⚠️ 重量超限: {request.weight_remark}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">联单信息</h3>
                            {!request.manifest_form && request.status === 'pending' && (
                                <button
                                    onClick={() => setShowManifestModal(true)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                                >
                                    上传联单
                                </button>
                            )}
                        </div>
                        <div className="p-6">
                            {request.manifest_form ? (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-gray-500">联单号:</span>
                                            <span className="ml-2 font-medium">{request.manifest_form.manifest_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">签发日期:</span>
                                            <span className="ml-2 font-medium">{request.manifest_form.issue_date}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">联单文件:</span>
                                            <span className="ml-2 font-medium">{request.manifest_form.manifest_document || '未上传'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">状态:</span>
                                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                request.manifest_form.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                request.manifest_form.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {request.manifest_form.status_label}
                                            </span>
                                        </div>
                                    </div>
                                    {request.manifest_form.verification_remark && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-gray-500 text-sm">审核备注:</span>
                                            <p className="mt-1">{request.manifest_form.verification_remark}</p>
                                        </div>
                                    )}
                                    {request.manifest_form.status === 'pending' && request.status === 'pending' && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => setShowVerifyModal(true)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                            >
                                                确认联单
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="mt-2">暂无联单信息</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {request.status === 'manifest_verified' && !request.review && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">复核操作</h3>
                            </div>
                            <div className="p-6">
                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                                >
                                    进行复核
                                </button>
                                {isCarrierExpired && (
                                    <p className="mt-2 text-sm text-orange-600">
                                        提示：由于承运单位资质过期，当前仅可选择退回或归档
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {request.review && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">复核结果</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center space-x-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                        request.review.result === 'approved' ? 'bg-green-100 text-green-800' :
                                        request.review.result === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {request.review.result_label}
                                    </span>
                                    <span className="text-gray-500">
                                        复核人: {request.review.reviewed_by.name} | {request.review.created_at}
                                    </span>
                                </div>
                                {request.review.review_remark && (
                                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-600">{request.review.review_remark}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">处理历史节点</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {request.process_histories.map((history, index) => (
                                    <div key={history.id} className="flex">
                                        <div className="flex flex-col items-center mr-4">
                                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                            {index < request.process_histories.length - 1 && (
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

            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold mb-4">复核决定</h3>
                        {isCarrierExpired && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-700">
                                    ⚠️ 承运单位资质已过期，<strong>无法选择放行</strong>。请选择退回或归档，或先更换承运单位。
                                </p>
                            </div>
                        )}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            postReview(route('reviews.store'));
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">复核结果</label>
                                <select
                                    value={reviewData.result}
                                    onChange={(e) => setReviewData('result', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                >
                                    <option value="approved" disabled={isCarrierExpired}>
                                        放行 {isCarrierExpired && '(资质过期，不可选)'}
                                    </option>
                                    <option value="rejected">退回</option>
                                    <option value="archived">归档</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">复核备注</label>
                                <textarea
                                    value={reviewData.review_remark}
                                    onChange={(e) => setReviewData('review_remark', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="请输入复核备注（可选）"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={reviewProcessing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                                >
                                    确认提交
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showChangeCarrierModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold mb-4">更换承运单位</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            选择一个具有有效资质的承运单位以继续复核流程。
                        </p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            postCarrier(route('transfer-requests.update-carrier', request.id), {
                                onSuccess: () => setShowChangeCarrierModal(false)
                            });
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">选择承运单位</label>
                                <select
                                    value={carrierData.carrier_id}
                                    onChange={(e) => setCarrierData('carrier_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                    required
                                >
                                    <option value="">请选择承运单位</option>
                                    {carriers && carriers.map((carrier) => {
                                        const expired = new Date(carrier.qualification_expiry_date) < new Date();
                                        return (
                                            <option key={carrier.id} value={carrier.id} disabled={expired}>
                                                {carrier.name} {expired ? '(资质过期)' : `(有效期至: ${carrier.qualification_expiry_date})`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowChangeCarrierModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={carrierProcessing || !carrierData.carrier_id}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium disabled:opacity-50"
                                >
                                    确认更换
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showManifestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold mb-4">上传联单信息</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            postManifest(route('manifest-forms.store'));
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">联单号</label>
                                <input
                                    type="text"
                                    value={manifestData.manifest_number}
                                    onChange={(e) => setManifestData('manifest_number', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="请输入联单号"
                                />
                                {manifestErrors.manifest_number && (
                                    <p className="mt-1 text-sm text-red-600">{manifestErrors.manifest_number}</p>
                                )}
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">签发日期</label>
                                <input
                                    type="date"
                                    value={manifestData.issue_date}
                                    onChange={(e) => setManifestData('issue_date', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">联单文件（填写文件名）</label>
                                <input
                                    type="text"
                                    value={manifestData.manifest_document}
                                    onChange={(e) => setManifestData('manifest_document', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="如：联单扫描件_20240101.pdf"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowManifestModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={manifestProcessing}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                                >
                                    提交
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showVerifyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold mb-4">联单确认</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            postVerify(route('manifest-forms.verify', request.manifest_form.id));
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">确认结果</label>
                                <select
                                    value={verifyData.status}
                                    onChange={(e) => setVerifyData('status', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                >
                                    <option value="verified">确认通过</option>
                                    <option value="rejected">驳回</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">确认备注</label>
                                <textarea
                                    value={verifyData.verification_remark}
                                    onChange={(e) => setVerifyData('verification_remark', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="请输入确认备注（可选）"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowVerifyModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={verifyProcessing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                                >
                                    确认
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
