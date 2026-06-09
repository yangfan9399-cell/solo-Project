import Link from "next/link";
import { getDepartments } from "../../lib/api";
import { createAdmission } from "../../lib/actions";

export const dynamic = "force-dynamic";

export default async function AdmissionPage() {
  const departments = await getDepartments();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-flex items-center gap-1">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">入院登记</h1>
        <p className="text-gray-600">前台登记新的住院病例</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form action={createAdmission} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              主人信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主人姓名 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入主人姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="tel"
                  name="ownerPhone"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身份证号
                </label>
                <input
                  type="text"
                  name="ownerIdCard"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入身份证号"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家庭住址
                </label>
                <input
                  type="text"
                  name="ownerAddress"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入家庭住址"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              宠物信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  宠物名字 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  name="petName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入宠物名字"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  宠物类型 <span className="text-danger-500">*</span>
                </label>
                <select
                  name="petType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择</option>
                  <option value="DOG">犬</option>
                  <option value="CAT">猫</option>
                  <option value="RABBIT">兔</option>
                  <option value="BIRD">鸟</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  品种
                </label>
                <input
                  type="text"
                  name="petBreed"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入品种"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性别
                </label>
                <select
                  name="petGender"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择</option>
                  <option value="公">公</option>
                  <option value="母">母</option>
                  <option value="未知">未知</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年龄（岁）
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="petAge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入年龄"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  体重（kg）
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="petWeight"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入体重"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              住院信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  收治科室 <span className="text-danger-500">*</span>
                </label>
                <select
                  name="departmentId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择科室</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  病房/病区
                </label>
                <input
                  type="text"
                  name="ward"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="如：内科A区"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  笼位号
                </label>
                <input
                  type="text"
                  name="cageNumber"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="如：A-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  初步诊断
                </label>
                <input
                  type="text"
                  name="primaryDiagnosis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入初步诊断"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  入院日期
                </label>
                <input
                  type="date"
                  name="admissionDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主诉
                </label>
                <textarea
                  rows={3}
                  name="chiefComplaint"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="请输入宠物主人描述的症状和情况"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              取消
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              提交入院登记
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
