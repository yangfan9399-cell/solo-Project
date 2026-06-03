import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { userApi } from '../../api/users';
import { useNotificationStore } from '../../store/notificationStore';
import type { User, UserRole } from '../../types';
import { ROLE_OPTIONS } from '../../utils/constants';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess?: () => void;
}

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  email?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { success, error } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    role: 'reporter',
    department: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        confirmPassword: '',
        name: user.name,
        email: user.email || '',
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        email: '',
        role: 'reporter',
        department: '',
        phone: '',
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    }
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = '密码不能为空';
      } else if (formData.password.length < 6) {
        newErrors.password = '密码至少6位';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '请确认密码';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    if (!formData.name.trim()) {
      newErrors.name = '姓名不能为空';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const submitData: Partial<User> & { password?: string } = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      let response;
      if (isEdit && user) {
        response = await userApi.update(user.id, submitData);
      } else {
        response = await userApi.create(submitData as Partial<User> & { password: string });
      }

      if (response.success) {
        success(isEdit ? '用户更新成功' : '用户创建成功');
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
      title={isEdit ? '编辑用户' : '新增用户'}
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
          <label className="form-label required">用户名</label>
          <input
            type="text"
            className={`form-input ${errors.username ? 'border-red-500' : ''}`}
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="请输入用户名"
            disabled={isEdit}
          />
          {errors.username && <p className="form-error">{errors.username}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">姓名</label>
          <input
            type="text"
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入姓名"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className={`form-label ${!isEdit ? 'required' : ''}`}>密码</label>
          <input
            type="password"
            className={`form-input ${errors.password ? 'border-red-500' : ''}`}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={isEdit ? '不修改请留空' : '请输入密码'}
          />
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>

        <div className="space-y-1">
          <label className={`form-label ${!isEdit ? 'required' : ''}`}>确认密码</label>
          <input
            type="password"
            className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder={isEdit ? '不修改请留空' : '请再次输入密码'}
            disabled={isEdit && !formData.password}
          />
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">邮箱</label>
          <input
            type="email"
            className={`form-input ${errors.email ? 'border-red-500' : ''}`}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="请输入邮箱"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label required">角色</label>
          <select
            className="form-select"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value as UserRole)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="form-label">部门</label>
          <input
            type="text"
            className="form-input"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="请输入部门"
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">电话</label>
          <input
            type="text"
            className="form-input"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="请输入电话"
          />
        </div>
      </div>
    </Modal>
  );
};

export default UserForm;
