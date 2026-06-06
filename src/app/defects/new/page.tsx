"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  defectLevelLabels,
  deviceTypeLabels,
  cn,
} from "@/lib/utils";
import type { PowerStation, Device } from "@/lib/mock-data";

export default function NewDefectPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [stations, setStations] = useState<PowerStation[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    stationId: "",
    deviceId: "",
    title: "",
    description: "",
    defectLevel: "major",
    deviceType: "pv_module",
    affectedPower: "",
    location: "",
    array: "",
  });

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (formData.stationId) {
      fetchDevices(parseInt(formData.stationId));
    } else {
      setDevices([]);
    }
  }, [formData.stationId]);

  const fetchStations = async () => {
    try {
      const res = await fetch("/api/stations");
      const data = await res.json();
      setStations(data);
    } catch (error) {
      console.error("获取电站列表失败", error);
    }
  };

  const fetchDevices = async (stationId: number) => {
    try {
      const res = await fetch(`/api/devices?stationId=${stationId}`);
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error("获取设备列表失败", error);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.stationId) newErrors.stationId = "请选择电站";
    if (!formData.deviceId) newErrors.deviceId = "请选择设备";
    if (!formData.title.trim()) newErrors.title = "请输入缺陷标题";
    if (!formData.description.trim()) newErrors.description = "请输入缺陷描述";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser) return;

    setLoading(true);
    try {
      const res = await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          stationId: parseInt(formData.stationId),
          deviceId: parseInt(formData.deviceId),
          inspectorId: currentUser.id,
          photoUrls: [
            "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop",
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/defects/${data.id}`);
      } else {
        alert("提交失败，请重试");
      }
    } catch (error) {
      console.error("提交缺陷失败", error);
      alert("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-900">登记缺陷</h1>
          <p className="mt-1 text-sm text-gray-500">
            填写缺陷信息，提交后进入分派流程
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                电站 <span className="text-red-500">*</span>
              </label>
              <select
                name="stationId"
                value={formData.stationId}
                onChange={handleChange}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                  errors.stationId
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
                )}
              >
                <option value="">请选择电站</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              {errors.stationId && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.stationId}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                设备 <span className="text-red-500">*</span>
              </label>
              <select
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                disabled={!formData.stationId}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400",
                  errors.deviceId
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
                )}
              >
                <option value="">请选择设备</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
              {errors.deviceId && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.deviceId}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                设备类型
              </label>
              <select
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              >
                {Object.entries(deviceTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                缺陷等级
              </label>
              <select
                name="defectLevel"
                value={formData.defectLevel}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              >
                {Object.entries(defectLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                缺陷标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="请简要描述缺陷"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                  errors.title
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
                )}
              />
              {errors.title && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                方阵/区域
              </label>
              <input
                type="text"
                name="array"
                value={formData.array}
                onChange={handleChange}
                placeholder="如：A区1号方阵"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                影响功率 (kW)
              </label>
              <input
                type="number"
                name="affectedPower"
                value={formData.affectedPower}
                onChange={handleChange}
                placeholder="请输入影响功率"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                缺陷描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="请详细描述缺陷情况，包括发现方式、具体位置、严重程度等"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                  errors.description
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-amber-400 focus:ring-amber-100"
                )}
              />
              {errors.description && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                缺陷照片
              </label>
              <div className="flex items-center gap-4">
                <div className="flex h-32 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="text-center text-gray-400">
                    <Camera className="mx-auto h-8 w-8" />
                    <p className="mt-2 text-xs">上传照片</p>
                  </div>
                </div>
                <div className="aspect-video h-32 w-40 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop"
                    alt="示例照片"
                    className="h-full w-full object-cover opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  示例占位图，实际项目中支持上传
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {loading ? "提交中..." : "提交登记"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
