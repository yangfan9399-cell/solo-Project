import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { damageReportApi } from '../../api/damageReports';
import { equipmentApi } from '../../api/equipments';
import { useNotificationStore } from '../../store/notificationStore';
import type { DamageReport, Equipment, DamageType } from '../../types';
import { DAMAGE_TYPE_OPTIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

interface DamageReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  report?: DamageReport | null;
  onSuccess?: () => void;
}

interface FormData {
  equipment_id: string;
  reservation_id: string;
  damage_type: DamageType;
  description: string;
  occurred_time: string;
  location: string;
  remark: string;
}

interface FormErrors {
  equipment_id?: string;
  damage_type?: string;
  description?: string;
  occurred_time?: string;
}

export const DamageReportForm: React.FC<DamageReportFormProps> = ({
  isOpen,
  onClose,
  report,
  onSuccess,
}) => {
  const { success, error } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    equipment_id: '',
    reservation_id: '',
    damage_type: 'minor',
    description: '',
    occurred_time: '',
    location: '',
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isEdit = !!report;

  useEffect(() => {
    const fetchEquipments = async () => {
      setLoadingEquipments(true);
      try {
        const response = await equipmentApi.getList({ status: 'available' });
        if (response.success && response.data) {
          setEquipments(response.data);
        }
      } catch (e) {
        error('加载设备列表失败');
      } finally {
        setLoadingEquipments(false);
      }
    };

    if (isOpen) {
      fetchEquipments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (report) {
      setFormData({
        equipment_id: String(report.equipment_id),
        reservation_id: '',
        damage_type: report.damage_type,
        description: report.description,
        occurred_time: report.occurred_time ? report.occurred_time.slice(0, 16) : '',
        location: report.location,
        remark: report.remark,
      });
    } else {
      setFormData({
        equipment_id: '',
        reservation_id: '',
        damage_type: 'minor',
        description: '',
        occurred_time: new Date().toISOString().slice(0, 16),
        location: '',
        remark: '',
      });
    }
    setErrors({});
  }, [report, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.equipment_id) {
      newErrors.equipment_id = '请选择设备';
    }
    if (!formData.damage_type) {
      newErrors.damage_type = '请选择损坏程度';
    }
    if (!formData.description.trim()) {
      newErrors.description = '损坏描述不能为空';
    }
    if (!formData.occurred_time) {
      newErrors.occurred_time = '请选择发生时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const submitData = {
        equipment_id: parseInt(formData.equipment_id, 10),
        damage_type: formData.damage_type,
        description: formData.description,
        occurred_time: new Date(formData.occurred_time).toISOString(),
        location: formData.location,
        remark: formData.remark,
      };

      let response;
      if (isEdit && report) {
        response = await damageReportApi.update(report.id, submitData);
      } else {
        response = await damageReportApi.create(submitData);
      }

      if (response.success) {
        success(isEdit ? '损坏报告更新成功' : '损坏报告创建成功');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '编辑损坏报告' : '新增损坏报告'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading || loadingEquipments}>
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
        <div className="space-y-1">
          <label className="form-label required">设备</label>
          <select
            className={`form-select ${errors.equipment_id ? 'border-red-500' : ''}`}
            value={formData.equipment_id}
            onChange={(e) => handleChange('equipment_id', e.target.value)}
            disabled={loadingEquipments || isEdit}
          >
            <option value="">请选择设备</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.code})
              </option>
            ))}
          </select>
          {errors.equipment_id && <p className="form-error">{errors.equipment_id}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">关联预约</label>
          <input
            type="text"
            className="form-input"
            value={formData.reservation_id}
            onChange={(e) => handleChange('reservation_id', e.target.value)}
            placeholder="可选，输入关联的预约ID"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label required">损坏程度</label>
          <select
            className={`form-select ${errors.damage_type ? 'border-red-500' : ''}`}
            value={formData.damage_type}
            onChange={(e) => handleChange('damage_type', e.target.value as DamageType)}
          >
            {DAMAGE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.damage_type && <p className="form-error">{errors.damage_type}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">损坏描述</label>
          <textarea
            className={`form-textarea ${errors.description ? 'border-red-500' : ''}`}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="请详细描述损坏情况"
            rows={4}
          />
          {errors.description && <p className="form-error">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="form-label required">发生时间</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.occurred_time ? 'border-red-500' : ''}`}
              value={formData.occurred_time}
              onChange={(e) => handleChange('occurred_time', e.target.value)}
            />
            {errors.occurred_time && <p className="form-error">{errors.occurred_time}</p>}
          </div>

          <div className="space-y-1">
            <label className="form-label">发生地点</label>
            <input
              type="text"
              className="form-input"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="请输入发生地点"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="form-label">报告人备注</label>
          <textarea
            className="form-textarea"
            value={formData.remark}
            onChange={(e) => handleChange('remark', e.target.value)}
            placeholder="可选，输入其他需要说明的信息"
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DamageReportForm;
