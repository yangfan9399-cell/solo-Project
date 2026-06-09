"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSample } from "@/lib/actions/sample-actions";
import { ArrowLeft, Plus, X, Save } from "lucide-react";
import Link from "next/link";

const defaultTestItems = [
  "重金属检测",
  "微生物检测",
  "农药残留检测",
  "食品添加剂检测",
  "感官检验",
  "标签审核",
  "规格检验",
  "包装检验",
];

const ports = ["上海港", "深圳港", "宁波港", "广州港", "青岛港", "天津港", "厦门港"];
const categories = ["食品", "化妆品", "电子产品", "服装", "机械设备", "化工品", "农产品"];

export default function NewSamplePage() {
  const router = useRouter();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState("");
  const [loading, setLoading] = useState(false);

  const addTestItem = (item: string) => {
    if (!selectedTests.includes(item)) {
      setSelectedTests([...selectedTests, item]);
    }
  };

  const removeTestItem = (item: string) => {
    setSelectedTests(selectedTests.filter((t) => t !== item));
  };

  const addCustomTest = () => {
    if (customTest.trim() && !selectedTests.includes(customTest.trim())) {
      setSelectedTests([...selectedTests, customTest.trim()]);
      setCustomTest("");
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      selectedTests.forEach((test, idx) => {
        formData.append("testItems", test);
      });
      await createSample(formData);
    } catch (error) {
      console.error("创建样品失败:", error);
      setLoading(false);
      alert("创建失败，请检查输入");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/samples"
          className="mr-4 p-2 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">新建取样登记</h1>
          <p className="text-slate-500 mt-1">登记新的进出口查验样品信息</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                报关单号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customsDeclarationNo"
                required
                placeholder="请输入报关单号"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                货物名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="goodsName"
                required
                placeholder="请输入货物名称"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                商品类别 <span className="text-red-500">*</span>
              </label>
              <select
                name="goodsCategory"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              >
                <option value="">请选择商品类别</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                HS编码
              </label>
              <input
                type="text"
                name="hsCode"
                placeholder="请输入HS编码"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                数量
              </label>
              <input
                type="number"
                name="quantity"
                placeholder="数量"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                单位
              </label>
              <input
                type="text"
                name="unit"
                placeholder="如：箱、件、千克"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                原产国
              </label>
              <input
                type="text"
                name="originCountry"
                placeholder="请输入原产国"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                口岸 <span className="text-red-500">*</span>
              </label>
              <select
                name="port"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              >
                <option value="">请选择口岸</option>
                {ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                收货人
              </label>
              <input
                type="text"
                name="consignee"
                placeholder="请输入收货人"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                发货人
              </label>
              <input
                type="text"
                name="consignor"
                placeholder="请输入发货人"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">取样信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                取样地点
              </label>
              <input
                type="text"
                name="samplingLocation"
                placeholder="请输入取样地点"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                取样备注
              </label>
              <input
                type="text"
                name="samplingNotes"
                placeholder="取样说明或备注"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            检测项目 <span className="text-red-500">*</span>
            <span className="text-sm font-normal text-slate-500 ml-2">
              已选择 {selectedTests.length} 项
            </span>
          </h2>

          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">常用检测项目：</p>
            <div className="flex flex-wrap gap-2">
              {defaultTestItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    selectedTests.includes(item)
                      ? removeTestItem(item)
                      : addTestItem(item)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedTests.includes(item)
                      ? "bg-customs-100 border-customs-300 text-customs-700"
                      : "bg-white border-slate-300 text-slate-600 hover:border-customs-400"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">自定义检测项目：</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTest}
                onChange={(e) => setCustomTest(e.target.value)}
                placeholder="输入自定义检测项目名称"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customs-500 focus:border-customs-500 outline-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTest();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomTest}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
              >
                添加
              </button>
            </div>
          </div>

          {selectedTests.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">已选检测项目：</p>
              <div className="flex flex-wrap gap-2">
                {selectedTests.map((test, idx) => (
                  <span
                    key={`${test}-${idx}`}
                    className="inline-flex items-center px-3 py-1 bg-customs-100 text-customs-700 rounded-full text-sm"
                  >
                    {test}
                    <button
                      type="button"
                      onClick={() => removeTestItem(test)}
                      className="ml-2 hover:text-customs-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/samples"
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading || selectedTests.length === 0}
            className="px-6 py-2.5 bg-customs-600 hover:bg-customs-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "保存中..." : "保存登记"}
          </button>
        </div>
      </form>
    </div>
  );
}
