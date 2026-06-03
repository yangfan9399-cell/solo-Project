import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import { reservationApi } from '../../api/reservations';
import { equipmentApi } from '../../api/equipments';
import { taskApi } from '../../api/tasks';
import { useNotificationStore } from '../../store/notificationStore';
import type { Reservation, Equipment, ShootingTask } from '../../types';
import { formatDateTime } from '../../utils/format';
import dayjs from 'dayjs';

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
  onSuccess?: () => void;
  defaultTaskId?: number;
}

interface FormData {
  equipment_id: string;
  task_id: string;
  expected_pickup_time: string;
  expected_return_time: string;
  purpose: string;
  remark: string;
}

interface FormErrors {
  equipment_id?: string;
  expected_pickup_time?: string;
  expected_return_time?: string;
  purpose?: string;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  isOpen,
  onClose,
  reservation,
  onSuccess,
  defaultTaskId,
}) => {
  const { success, error } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<ShootingTask[]>([]);
  const [scheduleConflict, setScheduleConflict] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    equipment_id: '',
    task_id: '',
    expected_pickup_time: '',
    expected_return_time: '',
    purpose: '',
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isEdit = !!reservation;
  const canEdit = !isEdit || reservation?.status === 'pending';

  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (reservation) {
      setFormData({
        equipment_id: reservation.equipment_id.toString(),
        task_id: reservation.task_id?.toString() || '',
        expected_pickup_time: dayjs(reservation.expected_pickup_time).format('YYYY-MM-DDTHH:mm'),
        expected_return_time: dayjs(reservation.expected_return_time).format('YYYY-MM-DDTHH:mm'),
        purpose: reservation.purpose,
        remark: reservation.remark,
      });
    } else {
      setFormData({
        equipment_id: '',
        task_id: defaultTaskId?.toString() || '',
        expected_pickup_time: '',
        expected_return_time: '',
        purpose: '',
        remark: '',
      });
    }
    setErrors({});
    setScheduleConflict(null);
  }, [reservation, isOpen, defaultTaskId]);

  const loadOptions = async () => {
    try {
      const [equipResponse, taskResponse] = await Promise.all([
        equipmentApi.getList({ status: 'available' }),
        taskApi.getList({ status: 'approved' }),
      ]);
      if (equipResponse.success && equipResponse.data) {
        setEquipments(equipResponse.data);
      }
      if (taskResponse.success && taskResponse.data) {
        setTasks(taskResponse.data);
      }
    } catch (e) {
      error('加载选项失败，请稍后重试');
    }
  };

  const checkConflict = async () => {
    if (!formData.equipment_id || !formData.expected_pickup_time || !formData.expected_return_time) {
      setScheduleConflict(null);
      return;
    }

    const equipmentId = parseInt(formData.equipment_id);
    if (!equipmentId) return;

    setCheckingConflict(true);
    setScheduleConflict(null);
    try {
      const response = await equipmentApi.getSchedule(equipmentId, {
        start_date: formData.expected_pickup_time,
        end_date: formData.expected_return_time,
      });

      if (response.success && response.data) {
        const conflictingReservations = response.data.filter((item) => {
          if (isEdit && reservation && item.id === reservation.id) {
            return false;
          }
          if (['rejected', 'cancelled', 'returned'].includes(item.status)) {
            return false;
          }
          const itemStart = dayjs(item.start_time);
          const itemEnd = dayjs(item.end_time);
          const newStart = dayjs(formData.expected_pickup_time);
          const newEnd = dayjs(formData.expected_return_time);
          return newStart.isBefore(itemEnd) && newEnd.isAfter(itemStart);
        });

        if (conflictingReservations.length > 0) {
          const conflict = conflictingReservations[0];
          setScheduleConflict(
            `该设备在 ${formatDateTime(conflict.start_time)} ~ ${formatDateTime(conflict.end_time)} 已有预约（${conflict.requester_name}），请调整时间或选择其他设备。`
          );
        }
      }
    } catch (e) {
    } finally {
      setCheckingConflict(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkConflict();
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.equipment_id, formData.expected_pickup_time, formData.expected_return_time]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.equipment_id) {
      newErrors.equipment_id = '请选择设备';
    }
    if (!formData.expected_pickup_time) {
      newErrors.expected_pickup_time = '请选择预计领用时间';
    }
    if (!formData.expected_return_time) {
      newErrors.expected_return_time = '请选择预计归还时间';
    }
    if (formData.expected_pickup_time && formData.expected_return_time) {
      const pickup = dayjs(formData.expected_pickup_time);
      const returnTime = dayjs(formData.expected_return_time);
      if (returnTime.isBefore(pickup)) {
        newErrors.expected_return_time = '归还时间必须晚于领用时间';
      }
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = '请填写用途描述';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      error('当前状态不允许编辑');
      return;
    }
    if (!validate()) return;
    if (scheduleConflict) {
      error('存在档期冲突，请调整后再提交');
      return;
    }

    setIsLoading(true);
    try {
      const submitData: Partial<Reservation> = {
        equipment_id: parseInt(formData.equipment_id),
        task_id: formData.task_id ? parseInt(formData.task_id) : null,
        expected_pickup_time: formData.expected_pickup_time,
        expected_return_time: formData.expected_return_time,
        purpose: formData.purpose,
        remark: formData.remark,
      };

      let response;
      if (isEdit && reservation) {
        response = await reservationApi.update(reservation.id, submitData);
      } else {
        response = await reservationApi.create(submitData);
      }

      if (response.success) {
        success(isEdit ? '预约更新成功' : '预约创建成功');
        onSuccess?.();
        onClose();
      } else {
        error(response.error || '操作失败');
      }
    } catch (e) {
      error('操作失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const availableEquipments = useMemo(() => {
    if (isEdit && reservation) {
      const currentEquipment = equipments.find((e) => e.id === reservation.equipment_id);
      if (currentEquipment) {
        return [...equipments];
      }
    }
    return equipments.filter((e) => e.status === 'available');
  }, [equipments, isEdit, reservation]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '编辑预约' : '新增预约'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isLoading || !canEdit || !!scheduleConflict}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {isEdit && !canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              当前预约状态为&quot;{reservation?.status}&quot;，仅待审批状态的预约可编辑。
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="form-label required">设备</label>
            <select
              className={`form-select ${errors.equipment_id ? 'border-red-500' : ''}`}
              value={formData.equipment_id}
              onChange={(e) => handleChange('equipment_id', e.target.value)}
              disabled={!canEdit}
            >
              <option value="">请选择设备</option>
              {availableEquipments.map((equip) => (
                <option key={equip.id} value={equip.id}>
                  {equip.name} ({equip.code})
                </option>
              ))}
            </select>
            {errors.equipment_id && <p className="form-error">{errors.equipment_id}</p>}
          </div>

          <div className="space-y-1">
            <label className="form-label">关联任务</label>
            <select
              className="form-select"
              value={formData.task_id}
              onChange={(e) => handleChange('task_id', e.target.value)}
              disabled={!canEdit}
            >
              <option value="">无</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.task_no} - {task.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="form-label required">预计领用时间</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.expected_pickup_time ? 'border-red-500' : ''}`}
              value={formData.expected_pickup_time}
              onChange={(e) => handleChange('expected_pickup_time', e.target.value)}
              disabled={!canEdit}
            />
            {errors.expected_pickup_time && <p className="form-error">{errors.expected_pickup_time}</p>}
          </div>

          <div className="space-y-1">
            <label className="form-label required">预计归还时间</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.expected_return_time ? 'border-red-500' : ''}`}
              value={formData.expected_return_time}
              onChange={(e) => handleChange('expected_return_time', e.target.value)}
              disabled={!canEdit}
            />
            {errors.expected_return_time && <p className="form-error">{errors.expected_return_time}</p>}
          </div>
        </div>

        {checkingConflict && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            正在检查设备档期...
          </div>
        )}

        {scheduleConflict && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-800 text-sm">{scheduleConflict}</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="form-label required">用途描述</label>
          <textarea
            className={`form-textarea ${errors.purpose ? 'border-red-500' : ''}`}
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            placeholder="请详细描述使用用途"
            rows={3}
            disabled={!canEdit}
          />
          {errors.purpose && <p className="form-error">{errors.purpose}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">备注</label>
          <textarea
            className="form-textarea"
            value={formData.remark}
            onChange={(e) => handleChange('remark', e.target.value)}
            placeholder="请填写备注信息（可选）"
            rows={2}
            disabled={!canEdit}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReservationForm;
