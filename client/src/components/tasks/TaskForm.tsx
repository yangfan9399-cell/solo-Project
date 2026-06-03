import React, { useState, useEffect } from 'react';
import type { ShootingTask, Priority } from '../../types';
import { taskApi } from '../../api/tasks';
import { usePermission } from '../../hooks/usePermission';
import { PRIORITY_OPTIONS } from '../../utils/constants';
import { useNotificationStore } from '../../store/notificationStore';
import Loading from '../common/Loading';

interface TaskFormProps {
  task?: ShootingTask;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  title?: string;
  shooting_location?: string;
  shooting_start_time?: string;
  shooting_end_time?: string;
  priority?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSuccess, onCancel }) => {
  const { user, isReporter } = usePermission();
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shooting_location: '',
    shooting_start_time: '',
    shooting_end_time: '',
    priority: 'medium' as Priority,
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isEdit = !!task;

  const canEdit = () => {
    if (!isEdit) return true;
    if (isReporter()) {
      return task?.status === 'draft' && task?.reporter_id === user?.id;
    }
    return true;
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        shooting_location: task.shooting_location,
        shooting_start_time: task.shooting_start_time.slice(0, 16),
        shooting_end_time: task.shooting_end_time.slice(0, 16),
        priority: task.priority,
        remark: task.remark,
      });
    }
  }, [task]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题';
    }

    if (!formData.shooting_location.trim()) {
      newErrors.shooting_location = '请输入拍摄地点';
    }

    if (!formData.shooting_start_time) {
      newErrors.shooting_start_time = '请选择拍摄开始时间';
    }

    if (!formData.shooting_end_time) {
      newErrors.shooting_end_time = '请选择拍摄结束时间';
    }

    if (formData.shooting_start_time && formData.shooting_end_time) {
      const startTime = new Date(formData.shooting_start_time);
      const endTime = new Date(formData.shooting_end_time);
      if (endTime <= startTime) {
        newErrors.shooting_end_time = '结束时间必须晚于开始时间';
      }
    }

    if (!formData.priority) {
      newErrors.priority = '请选择优先级';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        shooting_start_time: new Date(formData.shooting_start_time).toISOString(),
        shooting_end_time: new Date(formData.shooting_end_time).toISOString(),
      };

      const response = isEdit
        ? await taskApi.update(task!.id, submitData)
        : await taskApi.create(submitData);

      if (response.success) {
        addNotification('success', isEdit ? '任务更新成功' : '任务创建成功');
        onSuccess();
      } else {
        addNotification('error', response.error || '操作失败');
      }
    } catch (error) {
      addNotification('error', '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (!canEdit()) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">您没有权限编辑此任务</p>
        <button onClick={onCancel} className="btn-secondary mt-4">
          返回
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">标题 <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="请输入任务标题"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="label">描述</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input min-h-[100px]"
          placeholder="请输入任务描述"
          rows={3}
        />
      </div>

      <div>
        <label className="label">拍摄地点 <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="shooting_location"
          value={formData.shooting_location}
          onChange={handleChange}
          className={`input ${errors.shooting_location ? 'input-error' : ''}`}
          placeholder="请输入拍摄地点"
        />
        {errors.shooting_location && <p className="text-red-500 text-sm mt-1">{errors.shooting_location}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">拍摄开始时间 <span className="text-red-500">*</span></label>
          <input
            type="datetime-local"
            name="shooting_start_time"
            value={formData.shooting_start_time}
            onChange={handleChange}
            className={`input ${errors.shooting_start_time ? 'input-error' : ''}`}
          />
          {errors.shooting_start_time && <p className="text-red-500 text-sm mt-1">{errors.shooting_start_time}</p>}
        </div>

        <div>
          <label className="label">拍摄结束时间 <span className="text-red-500">*</span></label>
          <input
            type="datetime-local"
            name="shooting_end_time"
            value={formData.shooting_end_time}
            onChange={handleChange}
            className={`input ${errors.shooting_end_time ? 'input-error' : ''}`}
          />
          {errors.shooting_end_time && <p className="text-red-500 text-sm mt-1">{errors.shooting_end_time}</p>}
        </div>
      </div>

      <div>
        <label className="label">优先级 <span className="text-red-500">*</span></label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className={`input ${errors.priority ? 'input-error' : ''}`}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
      </div>

      <div>
        <label className="label">备注</label>
        <textarea
          name="remark"
          value={formData.remark}
          onChange={handleChange}
          className="input min-h-[80px]"
          placeholder="请输入备注信息"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              保存中...
            </>
          ) : (
            isEdit ? '更新' : '创建'
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
