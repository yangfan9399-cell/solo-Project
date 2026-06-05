import { useState, useEffect } from 'react';
import { useNavigate, useLoaderData, Form } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { MeetingRoom, Department } from '../types';
import { checkConflict } from '../api/client';

function NewBooking() {
  const navigate = useNavigate();
  const { meetingRooms, departments } = useLoaderData() as { meetingRooms: MeetingRoom[], departments: Department[] };

  const [formData, setFormData] = useState({
    title: '',
    meetingRoomId: '',
    departmentId: '',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    applicant: '',
    equipmentNotes: '',
  });

  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [costAllocations, setCostAllocations] = useState<Array<{ departmentId: string; percentage: number }>>([
    { departmentId: '', percentage: 100 },
  ]);
  const [conflictInfo, setConflictInfo] = useState<{ hasConflict: boolean; message: string } | null>(null);
  const [equipmentWarning, setEquipmentWarning] = useState<string[]>([]);

  const selectedRoom = meetingRooms.find((r) => r.id === formData.meetingRoomId);

  const calculateTotalCost = () => {
    if (!selectedRoom || !formData.startTime || !formData.endTime) return 0;
    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
    return hours > 0 ? hours * selectedRoom.hourlyRate : 0;
  };

  const totalCost = calculateTotalCost();
  const totalPercentage = costAllocations.reduce((sum, c) => sum + c.percentage, 0);
  const costValid = Math.abs(totalPercentage - 100) < 0.01;

  useEffect(() => {
    const checkTimeConflict = async () => {
      if (formData.meetingRoomId && formData.date && formData.startTime && formData.endTime) {
        const start = `${formData.date}T${formData.startTime}`;
        const end = `${formData.date}T${formData.endTime}`;
        const conflict = await checkConflict(formData.meetingRoomId, start, end);
        setConflictInfo(conflict.hasConflict ? { hasConflict: true, message: conflict.reason } : null);
      } else {
        setConflictInfo(null);
      }
    };
    checkTimeConflict();
  }, [formData.meetingRoomId, formData.date, formData.startTime, formData.endTime]);

  useEffect(() => {
    if (formData.meetingRoomId && selectedEquipments.length > 0 && selectedRoom) {
      const roomEquipments = selectedRoom.equipments?.map((e: any) => e.name) || [];
      const missing = selectedEquipments.filter((eq) => !roomEquipments.includes(eq));
      setEquipmentWarning(missing);
    } else {
      setEquipmentWarning([]);
    }
  }, [formData.meetingRoomId, selectedEquipments, selectedRoom]);

  const handleCostAllocationChange = (index: number, field: 'departmentId' | 'percentage', value: string | number) => {
    const newAllocations = [...costAllocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setCostAllocations(newAllocations);
  };

  const addCostAllocation = () => {
    setCostAllocations([...costAllocations, { departmentId: '', percentage: 0 }]);
  };

  const removeCostAllocation = (index: number) => {
    if (costAllocations.length > 1) {
      setCostAllocations(costAllocations.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">新建会议室预订</h2>
          <p className="mt-1 text-sm text-gray-500">填写会议信息并提交预订申请</p>
        </div>
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="selectedEquipments" value={JSON.stringify(selectedEquipments)} />
        <input type="hidden" name="costAllocations" value={JSON.stringify(costAllocations)} />
        <input type="hidden" name="equipmentWarnings" value={JSON.stringify(equipmentWarning)} />
        <input type="hidden" name="totalCost" value={totalCost} />

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">会议主题 *</label>
              <input
                type="text"
                name="title"
                className="input"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入会议主题"
              />
            </div>
            <div>
              <label className="label">会议室 *</label>
              <select
                name="meetingRoomId"
                className="input"
                required
                value={formData.meetingRoomId}
                onChange={(e) => setFormData({ ...formData, meetingRoomId: e.target.value })}
              >
                <option value="">请选择会议室</option>
                {meetingRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - {room.floor}楼 ({room.capacity}人, ¥{room.hourlyRate}/小时)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">申请部门 *</label>
              <select
                name="departmentId"
                className="input"
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">请选择部门</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">日期 *</label>
              <input
                type="date"
                name="date"
                className="input"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">开始时间 *</label>
                <input
                  type="time"
                  name="startTime"
                  className="input"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">结束时间 *</label>
                <input
                  type="time"
                  name="endTime"
                  className="input"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">经办人 *</label>
              <input
                type="text"
                name="applicant"
                className="input"
                required
                value={formData.applicant}
                onChange={(e) => setFormData({ ...formData, applicant: e.target.value })}
                placeholder="请输入经办人姓名"
              />
            </div>
          </div>

          {conflictInfo && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <span className="text-red-700 font-medium">时间冲突: {conflictInfo.message}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">设备需求</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {['投影仪', '白板', '视频会议系统', '音响系统', '电子白板'].map((eq) => (
              <label key={eq} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEquipments.includes(eq)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEquipments([...selectedEquipments, eq]);
                    } else {
                      setSelectedEquipments(selectedEquipments.filter((i) => i !== eq));
                    }
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{eq}</span>
              </label>
            ))}
          </div>
          {equipmentWarning.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-orange-600 mr-2">⚠️</span>
                <span className="text-orange-700 font-medium">该会议室缺少设备: {equipmentWarning.join(', ')}</span>
              </div>
            </div>
          )}
          <div className="mt-4">
            <label className="label">设备说明</label>
            <textarea
              name="equipmentNotes"
              className="input"
              rows={3}
              value={formData.equipmentNotes}
              onChange={(e) => setFormData({ ...formData, equipmentNotes: e.target.value })}
              placeholder="请输入设备使用说明或特殊要求"
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">费用分摊</h3>
            <button type="button" onClick={addCostAllocation} className="btn btn-secondary text-sm">
              + 添加分摊部门
            </button>
          </div>
          <div className="space-y-3">
            {costAllocations.map((alloc, index) => (
              <div key={index} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="label">部门 {index + 1}</label>
                  <select
                    className="input"
                    value={alloc.departmentId}
                    onChange={(e) => handleCostAllocationChange(index, 'departmentId', e.target.value)}
                  >
                    <option value="">请选择部门</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="label">分摊比例 (%)</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    max="100"
                    value={alloc.percentage}
                    onChange={(e) => handleCostAllocationChange(index, 'percentage', Number(e.target.value))}
                  />
                </div>
                <div className="w-32">
                  <label className="label">金额</label>
                  <div className="py-2 px-3 bg-gray-100 rounded-lg text-gray-700">
                    {formatCurrency((totalCost * alloc.percentage) / 100)}
                  </div>
                </div>
                {costAllocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCostAllocation(index)}
                    className="mb-1 text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-gray-600">总费用:</span>
              <span className="ml-2 text-xl font-bold text-gray-900">{formatCurrency(totalCost)}</span>
            </div>
            <div className={`${!costValid ? 'text-red-600' : 'text-green-600'}`}>
              分摊比例合计: {totalPercentage}%
              {!costValid && ' (需等于100%)'}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">
            取消
          </button>
          <button type="submit" className="btn btn-primary">
            提交预订
          </button>
        </div>
      </Form>
    </div>
  );
}

export default NewBooking;
