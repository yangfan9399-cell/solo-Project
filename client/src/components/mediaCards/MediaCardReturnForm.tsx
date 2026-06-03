import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { mediaCardApi } from '../../api/mediaCards';
import { useNotificationStore } from '../../store/notificationStore';
import type { MediaCard } from '../../types';
import { formatDateTime } from '../../utils/format';

interface MediaCardReturnFormProps {
  isOpen: boolean;
  onClose: () => void;
  mediaCard: MediaCard | null;
  onSuccess?: () => void;
}

interface FormData {
  actual_return_time: string;
  return_status: 'normal' | 'damaged';
  damage_description: string;
  remark: string;
}

interface FormErrors {
  actual_return_time?: string;
  damage_description?: string;
}

export const MediaCardReturnForm: React.FC<MediaCardReturnFormProps> = ({
  isOpen,
  onClose,
  mediaCard,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    actual_return_time: '',
    return_status: 'normal',
    damage_description: '',
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        actual_return_time: new Date().toISOString().slice(0, 16),
        return_status: 'normal',
        damage_description: '',
        remark: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.actual_return_time) {
      newErrors.actual_return_time = '请选择实际归还时间';
    }
    if (formData.return_status === 'damaged' && !formData.damage_description.trim()) {
      newErrors.damage_description = '请描述损坏情况';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !mediaCard) return;

    setIsLoading(true);
    try {
      const response = await mediaCardApi.return(mediaCard.id, {
        return_remark: formData.remark,
        return_status: formData.return_status,
        damage_description: formData.return_status === 'damaged' ? formData.damage_description : undefined,
        actual_return_time: formData.actual_return_time,
      });

      if (response.success) {
        success(response.message || '素材卡归还成功');
        onSuccess?.();

        const damageReportId = (response as unknown as { damage_report_id?: number }).damage_report_id;
        if (damageReportId) {
          setTimeout(() => {
            navigate(`/damage-reports/${damageReportId}`);
          }, 1500);
        }

        onClose();
      } else {
        error(response.error || '归还失败');
      }
    } catch (e) {
      error('归还失败，请稍后重试');
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
      title="归还素材卡"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                提交中...
              </>
            ) : (
              '确认归还'
            )}
          </button>
        </>
      }
    >
      {mediaCard && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">素材卡信息</p>
            <p className="font-medium text-gray-900">
              {mediaCard.code} - {mediaCard.type} ({mediaCard.capacity})
            </p>
            <p className="text-sm text-gray-600 mt-1">
              借用人：{mediaCard.current_user_name}
            </p>
            <p className="text-sm text-gray-600">
              借出时间：{formatDateTime(mediaCard.borrow_time)}
            </p>
            <p className="text-sm text-gray-600">
              预计归还：{formatDateTime(mediaCard.expected_return_time)}
            </p>
          </div>

          <div className="space-y-1">
            <label className="form-label required">实际归还时间</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.actual_return_time ? 'border-red-500' : ''}`}
              value={formData.actual_return_time}
              onChange={(e) => handleChange('actual_return_time', e.target.value)}
            />
            {errors.actual_return_time && <p className="form-error">{errors.actual_return_time}</p>}
          </div>

          <div className="space-y-1">
            <label className="form-label required">归还状态</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="return_status"
                  value="normal"
                  checked={formData.return_status === 'normal'}
                  onChange={(e) => handleChange('return_status', e.target.value as 'normal' | 'damaged')}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">正常</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="return_status"
                  value="damaged"
                  checked={formData.return_status === 'damaged'}
                  onChange={(e) => handleChange('return_status', e.target.value as 'normal' | 'damaged')}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">损坏</span>
              </label>
            </div>
          </div>

          {formData.return_status === 'damaged' && (
            <div className="space-y-1">
              <label className="form-label required">损坏描述</label>
              <textarea
                className={`form-textarea ${errors.damage_description ? 'border-red-500' : ''}`}
                value={formData.damage_description}
                onChange={(e) => handleChange('damage_description', e.target.value)}
                placeholder="请详细描述损坏情况，系统将自动创建损坏报告"
                rows={3}
              />
              {errors.damage_description && <p className="form-error">{errors.damage_description}</p>}
              <p className="text-xs text-orange-600">
                提示：选择损坏并提交后，将自动创建损坏报告并跳转至报告详情页
              </p>
            </div>
          )}

          <div className="space-y-1">
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
      )}
    </Modal>
  );
};

export default MediaCardReturnForm;
