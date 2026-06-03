import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { equipmentApi } from '../../api/equipments';
import { useNotificationStore } from '../../store/notificationStore';
import type { Equipment } from '../../types';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUS_OPTIONS } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  code: string;
  category: string;
  brand: string;
  model: string;
  specification: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: string;
  stock_quantity: string;
  location: string;
  status: Equipment['status'];
  description: string;
  remark: string;
}

interface FormErrors {
  name?: string;
  code?: string;
  category?: string;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  isOpen,
  onClose,
  equipment,
  onSuccess,
}) => {
  const { success, error } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    category: '',
    brand: '',
    model: '',
    specification: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    stock_quantity: '1',
    location: '',
    status: 'available',
    description: '',
    remark: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isEdit = !!equipment;

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        code: equipment.code,
        category: equipment.category,
        brand: equipment.brand,
        model: equipment.model,
        specification: equipment.specification,
        serial_number: equipment.serial_number,
        purchase_date: equipment.purchase_date ? formatDate(equipment.purchase_date) : '',
        purchase_price: equipment.purchase_price != null ? String(equipment.purchase_price) : '',
        stock_quantity: equipment.stock_quantity != null ? String(equipment.stock_quantity) : '1',
        location: equipment.location,
        status: equipment.status,
        description: equipment.description || '',
        remark: equipment.remark,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        category: '',
        brand: '',
        model: '',
        specification: '',
        serial_number: '',
        purchase_date: '',
        purchase_price: '',
        stock_quantity: '1',
        location: '',
        status: 'available',
        description: '',
        remark: '',
      });
    }
    setErrors({});
  }, [equipment, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = '设备名称不能为空';
    }
    if (!formData.code.trim()) {
      newErrors.code = '设备编号不能为空';
    }
    if (!formData.category) {
      newErrors.category = '设备分类不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const submitData = {
        name: formData.name,
        code: formData.code,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        specification: formData.specification,
        serial_number: formData.serial_number,
        purchase_date: formData.purchase_date,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity, 10) : 1,
        status: formData.status,
        location: formData.location,
        description: formData.description,
        accessories: '',
        remark: formData.remark,
      };

      let response;
      if (isEdit && equipment) {
        response = await equipmentApi.update(equipment.id, submitData);
      } else {
        response = await equipmentApi.create(submitData);
      }

      if (response.success) {
        success(isEdit ? '设备更新成功' : '设备创建成功');
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
      title={isEdit ? '编辑设备' : '新增设备'}
      size="xl"
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
          <label className="form-label required">设备名称</label>
          <input
            type="text"
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入设备名称"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">设备编号</label>
          <input
            type="text"
            className={`form-input ${errors.code ? 'border-red-500' : ''}`}
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="请输入设备编号"
          />
          {errors.code && <p className="form-error">{errors.code}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">设备分类</label>
          <select
            className={`form-select ${errors.category ? 'border-red-500' : ''}`}
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">请选择分类</option>
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="form-error">{errors.category}</p>}
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
          <label className="form-label">型号</label>
          <input
            type="text"
            className="form-input"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="请输入型号"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">规格</label>
          <input
            type="text"
            className="form-input"
            value={formData.specification}
            onChange={(e) => handleChange('specification', e.target.value)}
            placeholder="请输入规格"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">序列号</label>
          <input
            type="text"
            className="form-input"
            value={formData.serial_number}
            onChange={(e) => handleChange('serial_number', e.target.value)}
            placeholder="请输入序列号"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">购买日期</label>
          <input
            type="date"
            className="form-input"
            value={formData.purchase_date}
            onChange={(e) => handleChange('purchase_date', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">购买价格</label>
          <input
            type="number"
            className="form-input"
            value={formData.purchase_price}
            onChange={(e) => handleChange('purchase_price', e.target.value)}
            placeholder="请输入购买价格"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">库存数量</label>
          <input
            type="number"
            className="form-input"
            value={formData.stock_quantity}
            onChange={(e) => handleChange('stock_quantity', e.target.value)}
            placeholder="请输入库存数量"
            min="1"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">存放位置</label>
          <input
            type="text"
            className="form-input"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="请输入存放位置"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">状态</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as Equipment['status'])}
          >
            {EQUIPMENT_STATUS_OPTIONS.map((opt) => (
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
            placeholder="请输入设备描述"
            rows={3}
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="form-label">备注</label>
          <textarea
            className="form-textarea"
            value={formData.remark}
            onChange={(e) => handleChange('remark', e.target.value)}
            placeholder="请输入备注"
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
};

export default EquipmentForm;
