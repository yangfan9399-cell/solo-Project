import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { mediaCardApi } from '../../api/mediaCards';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { MediaCard } from '../../types';
import { formatDateTime } from '../../utils/format';

interface MediaCardBorrowFormProps {
  isOpen: boolean;
  onClose: () => void;
  mediaCard: MediaCard | null;
  onSuccess?: () => void;
}

interface FormData {
  reservation_id: string;
  user_id: string;
  user_name: string;
  expected_return_time: string;
  remark: string;
}

interface FormErrors {
  user_id?: string;
  expected_return_time?: string;
}

export const MediaCardBorrowForm: React.FC<MediaCardBorrowFormProps> = ({
  isOpen,
  onClose,
  mediaCard,
  onSuccess,
}) => {
  const { success, error } = useNotificationStore();
  const { user } = usePermission();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    reservation_id: '',
    user_id: user?.id ? String(user.id) : '',
    user_name: user?.name || '',
    expected_return_time: '',
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        reservation_id: '',
        user_id: user?.id ? String(user.id) : '',
        user_name: user?.name || '',
        expected_return_time: '',
        remark: '',
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.user_id) {
      newErrors.user_id = '请选择借用人';
    }
    if (!formData.expected_return_time) {
      newErrors.expected_return_time = '请选择预计归还时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !mediaCard) return;

    setIsLoading(true);
    try {
      const response = await mediaCardApi.borrow(mediaCard.id, {
        user_id: parseInt(formData.user_id, 10),
        user_name: formData.user_name,
        expected_return_time: formData.expected_return_time,
      });

      if (response.success) {
        success('素材卡借出成功');
        onSuccess?.();
        onClose();
      } else {
        error(response.error || '借出失败');
      }
    } catch (e) {
      error('借出失败，请稍后重试');
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
      title="借用素材卡"
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
              '确认借用'
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
              当前状态：<span className="text-green-600 font-medium">可用</span>
            </p>
          </div>

          <div className="space-y-1">
            <label className="form-label">关联预约</label>
            <input
              type="text"
              className="form-input"
              value={formData.reservation_id}
              onChange={(e) => handleChange('reservation_id', e.target.value)}
              placeholder="可选，输入预约ID"
            />
          </div>

          <div className="space-y-1">
            <label className="form-label required">借用人</label>
            <input
              type="text"
              className={`form-input ${errors.user_id ? 'border-red-500' : ''}`}
              value={formData.user_name}
              disabled
            />
            {errors.user_id && <p className="form-error">{errors.user_id}</p>}
          </div>

          <div className="space-y-1">
            <label className="form-label required">预计归还时间</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.expected_return_time ? 'border-red-500' : ''}`}
              value={formData.expected_return_time}
              onChange={(e) => handleChange('expected_return_time', e.target.value)}
            />
            {errors.expected_return_time && <p className="form-error">{errors.expected_return_time}</p>}
          </div>

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

          <p className="text-xs text-gray-500">
            借用时间：{formatDateTime(new Date())}
          </p>
        </div>
      )}
    </Modal>
  );
};

export default MediaCardBorrowForm;
