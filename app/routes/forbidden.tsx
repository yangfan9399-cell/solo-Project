import { Link } from "@remix-run/react";

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">访问被拒绝</h1>
        <p className="text-gray-600 mb-8">您没有权限访问此页面，请联系管理员</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
