"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCategoryText } from "@/lib/utils";
import {
  createReport,
  getStores,
  getMedicines,
  getBatchesByMedicine,
  getInventoryByStoreAndBatch,
} from "@/lib/actions";

interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  region: string;
  manager: string;
  phone: string;
  createdAt: string;
}

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  specification: string;
  manufacturer: string;
  category: string;
  unit: string;
  price: string;
}

interface Batch {
  id: number;
  medicineId: number;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  medicine?: Medicine;
}

export default function NewReportPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    storeId: 1,
    medicineId: 1,
    batchId: 1,
    reportedQuantity: 0,
    inventoryQuantity: 0,
    notes: "",
    disposalType: "none" as "transfer" | "destruction" | "none",
    suggestedTransferStoreId: undefined as number | undefined,
    actualBatchNumber: "",
    systemBatchNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const [storesData, medicinesData] = await Promise.all([
        getStores(),
        getMedicines(),
      ]);
      setStores(storesData);
      setMedicines(medicinesData);

      if (medicinesData.length > 0) {
        const batchesData = await getBatchesByMedicine(medicinesData[0].id);
        setBatches(batchesData);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadBatches() {
      if (formData.medicineId) {
        const batchesData = await getBatchesByMedicine(formData.medicineId);
        setBatches(batchesData);
        if (batchesData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            batchId: batchesData[0].id,
            systemBatchNumber: batchesData[0].batchNumber,
            actualBatchNumber: batchesData[0].batchNumber,
          }));
        }
      }
    }
    loadBatches();
  }, [formData.medicineId]);

  useEffect(() => {
    async function loadInventory() {
      if (formData.storeId && formData.batchId) {
        const inventory = await getInventoryByStoreAndBatch(
          formData.storeId,
          formData.batchId
        );
        setFormData((prev) => ({
          ...prev,
          inventoryQuantity: inventory?.quantity || 0,
        }));
      }
    }
    loadInventory();
  }, [formData.storeId, formData.batchId]);

  const selectedMedicine = medicines.find((m) => m.id === formData.medicineId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await createReport({
        storeId: formData.storeId,
        reportedBy: 1,
        batchId: formData.batchId,
        reportedQuantity: formData.reportedQuantity,
        inventoryQuantity: formData.inventoryQuantity,
        notes: formData.notes,
        disposalType: formData.disposalType,
        suggestedTransferStoreId: formData.suggestedTransferStoreId,
        actualBatchNumber: formData.actualBatchNumber,
        systemBatchNumber: formData.systemBatchNumber,
      });

      if (result.success) {
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/reports");
        }, 2000);
      } else {
        setError(result.error || "提交失败");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("提交失败，请重试");
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">上报成功</h2>
          <p className="text-gray-600 mb-6">近效期药品上报已提交，正在跳转至上报列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/reports" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">新建近效期药品上报</h1>
        <p className="mt-1 text-gray-600">门店经办人上报近效期药品批次和库存说明</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📝 基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上报门店 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                药品名称 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.medicineId}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    medicineId: Number(e.target.value),
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {medicines.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} - {getCategoryText(medicine.category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                批次号 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => {
                  const batch = batches.find((b) => b.id === Number(e.target.value));
                  setFormData({
                    ...formData,
                    batchId: Number(e.target.value),
                    systemBatchNumber: batch?.batchNumber || "",
                    actualBatchNumber: batch?.batchNumber || "",
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} (有效期至: {batch.expiryDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">规格</label>
              <input
                type="text"
                value={selectedMedicine?.specification || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 库存信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                系统记录批号
              </label>
              <input
                type="text"
                value={formData.systemBatchNumber}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                实际盘点批号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.actualBatchNumber}
                onChange={(e) => setFormData({ ...formData, actualBatchNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入实际盘点的批号"
                required
              />
              <p className="mt-1 text-xs text-gray-500">如与系统记录不一致将自动阻断流程</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上报数量 ({selectedMedicine?.unit || "盒"}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.reportedQuantity}
                onChange={(e) => setFormData({ ...formData, reportedQuantity: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入上报数量"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                系统库存数量 ({selectedMedicine?.unit || "盒"})
              </label>
              <input
                type="number"
                min="0"
                value={formData.inventoryQuantity}
                onChange={(e) => setFormData({ ...formData, inventoryQuantity: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入系统库存数量"
              />
              <p className="mt-1 text-xs text-gray-500">系统记录的库存数量，用于比对</p>
            </div>
          </div>

          {formData.actualBatchNumber !== formData.systemBatchNumber && formData.actualBatchNumber && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-lg">🚫</span>
                <div>
                  <p className="font-medium text-red-800">批号不一致</p>
                  <p className="text-sm text-red-700">
                    实际盘点批号 ({formData.actualBatchNumber}) 与系统记录批号 ({formData.systemBatchNumber}) 不一致，流程将被阻断，请重新盘点确认
                  </p>
                </div>
              </div>
            </div>
          )}

          {formData.actualBatchNumber === formData.systemBatchNumber && formData.reportedQuantity !== formData.inventoryQuantity && formData.reportedQuantity > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium text-yellow-800">库存数量不一致</p>
                  <p className="text-sm text-yellow-700">
                    上报数量 ({formData.reportedQuantity}) 与系统库存数量 ({formData.inventoryQuantity}) 不一致，系统将标记为待核实
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔄 处置建议</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                建议处置方式
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="disposalType"
                    value="none"
                    checked={formData.disposalType === "none"}
                    onChange={(e) => setFormData({ ...formData, disposalType: e.target.value as "none" })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>待定</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-green-300 rounded-lg cursor-pointer hover:bg-green-50">
                  <input
                    type="radio"
                    name="disposalType"
                    value="transfer"
                    checked={formData.disposalType === "transfer"}
                    onChange={(e) => setFormData({ ...formData, disposalType: e.target.value as "transfer" })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-green-700">📤 调拨</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-red-300 rounded-lg cursor-pointer hover:bg-red-50">
                  <input
                    type="radio"
                    name="disposalType"
                    value="destruction"
                    checked={formData.disposalType === "destruction"}
                    onChange={(e) => setFormData({ ...formData, disposalType: e.target.value as "destruction" })}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-red-700">🗑️ 销毁</span>
                </label>
              </div>
            </div>

            {formData.disposalType === "transfer" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  建议调拨至门店
                </label>
                <select
                  value={formData.suggestedTransferStoreId || ""}
                  onChange={(e) => setFormData({ ...formData, suggestedTransferStoreId: Number(e.target.value) || undefined })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择目标门店</option>
                  {stores
                    .filter((s) => s.id !== formData.storeId)
                    .map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="请输入相关说明信息..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/reports"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "提交中..." : "提交上报"}
          </button>
        </div>
      </form>
    </div>
  );
}
