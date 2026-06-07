'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { AuthorizationTypeMap, ClassNameMap } from '@/types';
import type { AuthorizationType, ClassName } from '@/types';

export default function TeacherPage() {
  const { state, getAuthorizationsByChildId, addAuthorization, deactivateAuthorization } = useApp();
  
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [classFilter, setClassFilter] = useState<ClassName | 'all'>('all');
  const [formData, setFormData] = useState({
    name: '',
    idCardNumber: '',
    phone: '',
    relation: '',
    type: 'TEMPORARY' as AuthorizationType,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    remark: '',
  });
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const filteredChildren = classFilter === 'all' 
    ? state.children 
    : state.children.filter(c => c.className === classFilter);

  const selectedChildData = selectedChild 
    ? state.children.find(c => c.id === selectedChild) 
    : null;

  const selectedAuthorizations = selectedChild 
    ? getAuthorizationsByChildId(selectedChild) 
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!selectedChildData) return;
    if (!formData.name || !formData.idCardNumber || !formData.phone || !formData.relation) {
      alert('请填写必填字段');
      return;
    }

    addAuthorization({
      childId: selectedChildData.id,
      name: formData.name,
      relation: formData.relation,
      idCardNumber: formData.idCardNumber,
      phone: formData.phone,
      type: formData.type,
      isActive: true,
      validFrom: new Date(formData.validFrom).toISOString(),
      validTo: formData.validTo ? new Date(formData.validTo).toISOString() : undefined,
      registeredBy: '王老师',
      remark: formData.remark || undefined,
    });

    setShowAddModal(false);
    setFormData({
      name: '',
      idCardNumber: '',
      phone: '',
      relation: '',
      type: 'TEMPORARY',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      remark: '',
    });
  };

  const handleDeactivate = (authId: string) => {
    deactivateAuthorization(authId, '王老师');
    setShowConfirm(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          👩‍🏫 班主任授权管理
        </h1>
        <p className="text-gray-600">
          登记、变更幼儿接送授权信息
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">幼儿列表</h2>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value as ClassName | 'all')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部班级</option>
                <option value="CLASS_A">小班</option>
                <option value="CLASS_B">中班</option>
                <option value="CLASS_C">大班</option>
              </select>
            </div>
            <div className="space-y-2">
              {filteredChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    selectedChild === child.id
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">👶</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="text-xs text-gray-500">
                      {ClassNameMap[child.className]} · {child.gender}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedChildData ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl">👶</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedChildData.name}
                      </h2>
                      <p className="text-gray-500">
                        {ClassNameMap[selectedChildData.className]} · {selectedChildData.gender} · {new Date(selectedChildData.birthDate).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    + 新增授权
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    主监护人：{selectedChildData.primaryGuardianName} · {selectedChildData.primaryGuardianPhone}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  授权人列表 
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （共 {selectedAuthorizations.length} 条）
                  </span>
                </h3>
                {selectedAuthorizations.length > 0 ? (
                  <div className="space-y-4">
                    {selectedAuthorizations.map((auth) => (
                      <div
                        key={auth.id}
                        className={`p-4 rounded-lg border ${
                          auth.isActive
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-xl">👤</span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <p className="font-medium text-gray-900">{auth.name}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  auth.type === 'PRIMARY'
                                    ? 'bg-blue-100 text-blue-700'
                                    : auth.type === 'TEMPORARY'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {AuthorizationTypeMap[auth.type]}
                                </span>
                                {auth.isActive ? (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                    有效
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    已停用
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{auth.relation}</p>
                            </div>
                          </div>
                          {auth.isActive && (
                            <button
                              onClick={() => setShowConfirm(auth.id)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              停用授权
                            </button>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">身份证号：</span>
                            <span className="text-gray-700 font-mono">
                              {auth.idCardNumber.replace(/^(.{6})(.+)(.{4})$/, '$1********$3')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">联系电话：</span>
                            <span className="text-gray-700">{auth.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">有效期：</span>
                            <span className="text-gray-700">
                              {new Date(auth.validFrom).toLocaleDateString('zh-CN')}
                              {auth.validTo 
                                ? ` 至 ${new Date(auth.validTo).toLocaleDateString('zh-CN')}`
                                : ' · 长期有效'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">登记人：</span>
                            <span className="text-gray-700">{auth.registeredBy}</span>
                          </div>
                        </div>
                        {auth.remark && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            备注：{auth.remark}
                          </div>
                        )}

                        {showConfirm === auth.id && (
                          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-sm text-red-700 mb-3">
                              ⚠️ 确认要停用 {auth.name} 的接送授权吗？停用后该授权人将无法接送幼儿。
                            </p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleDeactivate(auth.id)}
                                className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                              >
                                确认停用
                              </button>
                              <button
                                onClick={() => setShowConfirm(null)}
                                className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">📝</p>
                    <p>暂无授权记录</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-5xl mb-4">👈</p>
              <p className="text-gray-500">请从左侧选择一位幼儿查看授权信息</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">新增接送授权</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  幼儿姓名
                </label>
                <input
                  type="text"
                  value={selectedChildData?.name || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授权人姓名 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="请输入授权人姓名"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身份证号 *
                </label>
                <input
                  type="text"
                  name="idCardNumber"
                  value={formData.idCardNumber}
                  onChange={handleInputChange}
                  placeholder="请输入18位身份证号"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="请输入手机号码"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  与幼儿关系 *
                </label>
                <select
                  name="relation"
                  value={formData.relation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择关系</option>
                  <option value="父亲">父亲</option>
                  <option value="母亲">母亲</option>
                  <option value="爷爷">爷爷</option>
                  <option value="奶奶">奶奶</option>
                  <option value="外公">外公</option>
                  <option value="外婆">外婆</option>
                  <option value="叔叔">叔叔</option>
                  <option value="阿姨">阿姨</option>
                  <option value="舅舅">舅舅</option>
                  <option value="舅妈">舅妈</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授权类型 *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PRIMARY">主授权</option>
                  <option value="TEMPORARY">临时授权</option>
                  <option value="EMERGENCY">紧急授权</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生效日期 *
                  </label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    失效日期
                  </label>
                  <input
                    type="date"
                    name="validTo"
                    value={formData.validTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注说明
                </label>
                <textarea
                  name="remark"
                  rows={3}
                  value={formData.remark}
                  onChange={handleInputChange}
                  placeholder="请输入备注说明（选填）"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认登记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
