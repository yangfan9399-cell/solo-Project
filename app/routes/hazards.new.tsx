import { useState } from 'react';
import { Form, useActionData, useNavigation, useNavigate, Link } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { requireRole } from '~/utils/session.server';
import type { HazardLevel, PhotoType } from '@prisma/client';

export const loader: LoaderFunction = async ({ request }) => {
  await requireRole(request, ['INSPECTOR']);
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireRole(request, ['INSPECTOR']);
  const formData = await request.formData();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const level = formData.get('level') as HazardLevel;
  const source = formData.get('source') as string;
  const photoUrl = formData.get('photoUrl') as string;
  const photoDescription = formData.get('photoDescription') as string;

  if (!title || !description || !location || !level) {
    return json({ error: '请填写必填字段' }, { status: 400 });
  }

  const hazard = await prisma.hazard.create({
    data: {
      title,
      description,
      location,
      level,
      source: source || '日常巡检',
      reporterId: user.id,
      statusTransitions: {
        create: {
          fromStatus: null,
          toStatus: 'REPORTED',
          remark: '巡检登记隐患',
          createdById: user.id,
        },
      },
    },
  });

  if (photoUrl) {
    await prisma.photo.create({
      data: {
        hazardId: hazard.id,
        type: 'BEFORE' as PhotoType,
        url: photoUrl,
        description: photoDescription || '现场照片',
        uploadedById: user.id,
      },
    });
  }

  return redirect(`/hazards/${hazard.id}`);
};

export default function NewHazard() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">登记消防隐患</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Form method="post" className="p-6 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {actionData.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              隐患标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="例如：消防通道堵塞"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                隐患等级 <span className="text-red-500">*</span>
              </label>
              <select
                name="level"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">请选择</option>
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="CRITICAL">紧急</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                来源
              </label>
              <input
                type="text"
                name="source"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="例如：日常巡检"
                defaultValue="日常巡检"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              位置 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="例如：A栋西侧消防通道"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="请详细描述隐患情况..."
              disabled={isSubmitting}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">现场照片（可选）</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  照片URL
                </label>
                <input
                  type="url"
                  name="photoUrl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://..."
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  照片说明
                </label>
                <input
                  type="text"
                  name="photoDescription"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="照片描述"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '提交中...' : '提交登记'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
