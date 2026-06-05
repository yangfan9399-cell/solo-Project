import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

export default function Create({ categories, locations }) {
    const { data, setData, post, processing, errors } = useForm({
        waste_category_id: '',
        storage_location_id: '',
        weight: '',
        description: '',
        production_date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('waste-batches.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    危废暂存登记
                </h2>
            }
        >
            <Head title="危废暂存登记" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    危废类别
                                </label>
                                <select
                                    value={data.waste_category_id}
                                    onChange={(e) => setData('waste_category_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">请选择危废类别</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.code} - {category.name} (限制: {category.max_weight_per_batch}kg)
                                        </option>
                                    ))}
                                </select>
                                {errors.waste_category_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.waste_category_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    暂存位置
                                </label>
                                <select
                                    value={data.storage_location_id}
                                    onChange={(e) => setData('storage_location_id', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">请选择暂存位置</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.code} - {location.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.storage_location_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.storage_location_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    重量 (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.weight}
                                    onChange={(e) => setData('weight', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="请输入重量"
                                />
                                {errors.weight && (
                                    <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    产生日期
                                </label>
                                <input
                                    type="date"
                                    value={data.production_date}
                                    onChange={(e) => setData('production_date', e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.production_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.production_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    备注说明
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="请输入备注说明（可选）"
                                />
                            </div>

                            <div className="flex justify-end space-x-4">
                                <Link
                                    href={route('waste-batches.index')}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    提交登记
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
