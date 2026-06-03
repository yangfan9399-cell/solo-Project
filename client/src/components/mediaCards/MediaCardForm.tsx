import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { mediaCardApi } from '../../api/mediaCards';
import { equipmentApi } from '../../api/equipments';
import { useNotificationStore } from '../../store/notificationStore';
import type { MediaCard, Equipment } from '../../types';
import { MEDIA_CARD_TYPES, MEDIA_CARD_STATUS_OPTIONS } from '../../utils/constants';

interface MediaCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  mediaCard?: MediaCard | null;
  onSuccess?: () => void;
}

interface FormData {
  code: string;
  type: string;
  capacity: string;
  brand: string;
  equipment_id: string;
  status: MediaCard['status'];
  description: string;
  remark: string;
}

interface FormErrors {
  code?: string;
  type?: string;
  capacity?: string;
}

export const MediaCardForm: React.FC<MediaCardFormProps> = ({
  isOpen,
  onClose,
  mediaCard,
  onSuccess,
}) => {
  const { success, error } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    type: '',
    capacity: '',
    brand: '',
    equipment_id: '',
    status: 'available',
    description: '',
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isEdit = !!mediaCard;

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await equipmentApi.getList({ status: 'available' });
        if (response.success && response.data) {
          setEquipments(response.data);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchEquipments();
  }, []);

  useEffect(() => {
    if (mediaCard) {
      setFormData({
        code: mediaCard.code,
        type: mediaCard.type,
        capacity: mediaCard.capacity,
        brand: mediaCard.brand,
        equipment_id: mediaCard.equipment_id ? String(mediaCard.equipment_id) : '',
        status: mediaCard.status,
        description: mediaCard.description,
        remark: mediaCard.remark,
      });
    } else {
      setFormData({
        code: '',
        type: '',
        capacity: '',
        brand: '',
        equipment_id: '',
        status: 'available',
        description: '',
        remark: '',
      });
    }
    setErrors({});
  }, [mediaCard, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = '卡号不能为空';
    }
    if (!formData.type) {
      newErrors.type = '类型不能为空';
    }
    if (!formData.capacity.trim()) {
      newErrors.capacity = '容量不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const submitData = {
        code: formData.code,
        type: formData.type,
        capacity: formData.capacity,
        brand: formData.brand,
        equipment_id: formData.equipment_id ? parseInt(formData.equipment_id, 10) : undefined,
        status: formData.status,
        description: formData.description,
        remark: formData.remark,
      };

      let response;
      if (isEdit && mediaCard) {
        response = await mediaCardApi.update(mediaCard.id, submitData);
      } else {
        response = await mediaCardApi.create(submitData);
      }

      if (response.success) {
        success(isEdit ? '素材卡更新成功' : '素材卡创建成功');
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
      title={isEdit ? '编辑素材卡' : '新增素材卡'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="form-label required">卡号</label>
          <input
            type="text"
            className={`form-input ${errors.code ? 'border-red-500' : ''}`}
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="请输入卡号"
          />
          {errors.code && <p className="form-error">{errors.code}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">类型</label>
          <select
            className={`form-select ${errors.type ? 'border-red-500' : ''}`}
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">请选择类型</option>
            {MEDIA_CARD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="form-error">{errors.type}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">容量</label>
          <input
            type="text"
            className={`form-input ${errors.capacity ? 'border-red-500' : ''}`}
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            placeholder="例如：128GB"
          />
          {errors.capacity && <p className="form-error">{errors.capacity}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">品牌</label>
          <input
            type="text"
            className="form-input"
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="请输入品牌"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">关联设备</label>
          <select
            className="form-select"
            value={formData.equipment_id}
            onChange={(e) => handleChange('equipment_id', e.target.value)}
          >
            <option value="">不关联设备</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="form-label">状态</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as MediaCard['status'])}
          >
            {MEDIA_CARD_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="form-label">描述</label>
          <textarea
            className="form-textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="请输入描述信息"
            rows={3}
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="form-label">备注</label>
          <textarea
            className="form-textarea"
            value={formData.remark}
            onChange={(e) => handleChange('remark', e.target.value)}
            placeholder="请输入备注信息"
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
};

export default MediaCardForm;
