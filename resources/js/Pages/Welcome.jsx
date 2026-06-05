import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            <Head title="危废转运管理平台" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        工厂危废转运申请与联单核验平台
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        危废从暂存、转运申请、联单确认到环保复核的全流程管理
                    </p>
                    
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">核心功能</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="text-left p-4 bg-green-50 rounded-lg">
                                <div className="font-semibold text-green-700 mb-2">📦 危废暂存登记</div>
                                <p className="text-sm text-gray-600">仓库经办人负责危废暂存和重量登记</p>
                            </div>
                            <div className="text-left p-4 bg-blue-50 rounded-lg">
                                <div className="font-semibold text-blue-700 mb-2">📋 转运申请</div>
                                <p className="text-sm text-gray-600">提交转运申请，自动检测重量超限</p>
                            </div>
                            <div className="text-left p-4 bg-purple-50 rounded-lg">
                                <div className="font-semibold text-purple-700 mb-2">✅ 联单确认</div>
                                <p className="text-sm text-gray-600">环保专员确认危废转运联单</p>
                            </div>
                            <div className="text-left p-4 bg-orange-50 rounded-lg">
                                <div className="font-semibold text-orange-700 mb-2">🔍 环保复核</div>
                                <p className="text-sm text-gray-600">复核人决定放行、退回或归档</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4 mb-8 text-left">
                            <div className="font-semibold text-yellow-700 mb-2">⚠️ 预置样本数据</div>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• 正常转运流程</li>
                                <li>• 重量超限提醒</li>
                                <li>• 联单缺失处理</li>
                                <li>• 承运单位资质过期（禁止放行）</li>
                            </ul>
                        </div>

                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                进入系统
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                登录系统
                            </Link>
                        )}
                    </div>

                    <div className="mt-8 text-sm text-gray-500">
                        <p>测试账号：warehouse@example.com / environmental@example.com / reviewer@example.com</p>
                        <p>密码：password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
