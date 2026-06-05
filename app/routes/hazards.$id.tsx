import { useState } from 'react';
import { Form, useLoaderData, useActionData, useNavigation, Link } from '@remix-run/react';
import type { ActionFunction, LoaderFunction, SerializeFrom } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { requireUser } from '~/utils/session.server';
import type {
  Hazard,
  Photo,
  StatusTransition,
  Rectification,
  User,
  HazardStatus,
  PhotoType,
  UserRole,
} from '@prisma/client';

type PhotoWithUploader = Photo & {
  uploadedBy: User;
};

type StatusTransitionWithCreator = StatusTransition & {
  createdBy: User;
};

type HazardDetailData = Hazard & {
  reporter: User;
  assignee: User | null;
  photos: PhotoWithUploader[];
  rectification: Rectification | null;
  statusTransitions: StatusTransitionWithCreator[];
};

type PropertyManagerSummary = {
  id: string;
  name: string;
  department: string | null;
};

type LoaderData = {
  user: User;
  hazard: HazardDetailData;
  propertyManagers: PropertyManagerSummary[];
  hasResponsibilityMismatch: boolean;
  mismatchReason: string | null;
};

type ActionError = {
  error: string;
  errorType?: string;
  missingPhotos?: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  const { id } = params;

  if (!id) {
    throw new Response('Not Found', { status: 404 });
  }

  const hazard = await prisma.hazard.findUnique({
    where: { id },
    include: {
      reporter: true,
      assignee: true,
      photos: {
        include: { uploadedBy: true },
        orderBy: { createdAt: 'asc' },
      },
      rectification: true,
      statusTransitions: {
        include: { createdBy: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!hazard) {
    throw new Response('Not Found', { status: 404 });
  }

  const propertyManagers = await prisma.user.findMany({
    where: { role: 'PROPERTY_MANAGER' },
    select: { id: true, name: true, department: true },
  });

  let hasResponsibilityMismatch = false;
  let mismatchReason: string | null = null;

  if (hazard.assignee) {
    if (hazard.assignee.role !== 'PROPERTY_MANAGER') {
      hasResponsibilityMismatch = true;
      mismatchReason = `责任人"${hazard.assignee.name}"的角色是${
        hazard.assignee.role === 'INSPECTOR' ? '巡检员' :
        hazard.assignee.role === 'FIRE_VERIFIER' ? '消防复核人' :
        hazard.assignee.role
      }，不是物业经办人`;
    } else if (['REJECTED', 'SUBMITTED'].includes(hazard.status) && hazard.assignee) {
      const lastRejectedTransition = hazard.statusTransitions
        .filter(t => t.toStatus === 'REJECTED')
        .slice(-1)[0];
      
      if (lastRejectedTransition && hazard.status === 'REJECTED') {
        const submittedAfterReject = hazard.statusTransitions.some(
          t => t.createdAt > lastRejectedTransition.createdAt && t.toStatus === 'SUBMITTED'
        );
        if (!submittedAfterReject) {
          hasResponsibilityMismatch = true;
          mismatchReason = `隐患已被退回重改，需重新提交整改后再进行验收`;
        }
      }
    }
  }

  return json<LoaderData>({
    user,
    hazard: hazard as unknown as HazardDetailData,
    propertyManagers,
    hasResponsibilityMismatch,
    mismatchReason,
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  const { id } = params;

  if (!id) {
    return json<ActionError>({ error: '隐患不存在' }, { status: 404 });
  }

  const formData = await request.formData();
  const _action = formData.get('_action') as string;

  const hazard = await prisma.hazard.findUnique({
    where: { id },
    include: { photos: true, rectification: true, assignee: true },
  });

  if (!hazard) {
    return json<ActionError>({ error: '隐患不存在' }, { status: 404 });
  }

  switch (_action) {
    case 'assign': {
      if (user.role !== 'FIRE_VERIFIER') {
        return json<ActionError>({ error: '无权限' }, { status: 403 });
      }
      const assigneeId = formData.get('assigneeId') as string;
      const measure = formData.get('measure') as string;
      const materials = formData.get('materials') as string;
      const deadline = formData.get('deadline') as string;
      const remark = formData.get('remark') as string;

      if (!assigneeId || !measure || !deadline) {
        return json<ActionError>({ error: '请填写完整信息', errorType: 'assign' }, { status: 400 });
      }

      await prisma.hazard.update({
        where: { id },
        data: {
          status: 'ASSIGNED' as HazardStatus,
          assigneeId,
          rectification: {
            create: {
              measure,
              materials: materials || '',
              deadline: new Date(deadline),
            },
          },
          statusTransitions: {
            create: {
              fromStatus: hazard.status,
              toStatus: 'ASSIGNED' as HazardStatus,
              remark: remark || '派发整改任务',
              createdById: user.id,
            },
          },
        },
      });

      return redirect(`/hazards/${id}`);
    }

    case 'start': {
      if (user.role !== 'PROPERTY_MANAGER' || hazard.assigneeId !== user.id) {
        return json<ActionError>({ error: '无权限' }, { status: 403 });
      }

      await prisma.hazard.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS' as HazardStatus,
          statusTransitions: {
            create: {
              fromStatus: hazard.status,
              toStatus: 'IN_PROGRESS' as HazardStatus,
              remark: '开始整改',
              createdById: user.id,
            },
          },
        },
      });

      return redirect(`/hazards/${id}`);
    }

    case 'submit': {
      if (user.role !== 'PROPERTY_MANAGER' || hazard.assigneeId !== user.id) {
        return json<ActionError>({ error: '无权限' }, { status: 403 });
      }

      const photoUrl = formData.get('photoUrl') as string;
      const photoDescription = formData.get('photoDescription') as string;
      const remark = formData.get('remark') as string;

      if (!photoUrl) {
        return json<ActionError>({ error: '请上传整改后照片', errorType: 'submit' }, { status: 400 });
      }

      await prisma.hazard.update({
        where: { id },
        data: {
          status: 'SUBMITTED' as HazardStatus,
          photos: {
            create: {
              type: 'AFTER' as PhotoType,
              url: photoUrl,
              description: photoDescription || '整改后照片',
              uploadedById: user.id,
            },
          },
          rectification: {
            update: {
              submittedAt: new Date(),
            },
          },
          statusTransitions: {
            create: {
              fromStatus: hazard.status,
              toStatus: 'SUBMITTED' as HazardStatus,
              remark: remark || '整改完成，申请验收',
              createdById: user.id,
            },
          },
        },
      });

      return redirect(`/hazards/${id}`);
    }

    case 'verify': {
      if (user.role !== 'FIRE_VERIFIER') {
        return json<ActionError>({ error: '无权限' }, { status: 403 });
      }

      const verifyResult = formData.get('verifyResult') as string;
      const remark = formData.get('remark') as string;

      const hasBeforePhoto = hazard.photos.some((p: Photo) => p.type === 'BEFORE');
      const hasAfterPhoto = hazard.photos.some((p: Photo) => p.type === 'AFTER');

      if (verifyResult === 'pass' && (!hasBeforePhoto || !hasAfterPhoto)) {
        return json<ActionError>({ 
          error: '整改前后照片不完整，请先补充证据照片后再验收',
          errorType: 'verify',
          missingPhotos: !hasBeforePhoto ? '缺少整改前照片' : (!hasAfterPhoto ? '缺少整改后照片' : '照片不完整')
        }, { status: 400 });
      }

      const newStatus = verifyResult === 'pass' ? 'PASSED' as HazardStatus : 'REJECTED' as HazardStatus;

      await prisma.hazard.update({
        where: { id },
        data: {
          status: newStatus,
          rectification: verifyResult === 'pass' ? {
            update: { verifiedAt: new Date() },
          } : undefined,
          statusTransitions: {
            create: {
              fromStatus: hazard.status,
              toStatus: newStatus,
              remark: remark || (verifyResult === 'pass' ? '验收通过' : '验收不通过，需重新整改'),
              createdById: user.id,
            },
          },
        },
      });

      return redirect(`/hazards/${id}`);
    }

    case 'archive': {
      if (user.role !== 'FIRE_VERIFIER') {
        return json<ActionError>({ error: '无权限' }, { status: 403 });
      }

      if (hazard.status !== 'PASSED') {
        return json<ActionError>({ error: '只能归档已通过验收的隐患' }, { status: 400 });
      }

      await prisma.hazard.update({
        where: { id },
        data: {
          status: 'ARCHIVED' as HazardStatus,
          statusTransitions: {
            create: {
              fromStatus: hazard.status,
              toStatus: 'ARCHIVED' as HazardStatus,
              remark: '隐患处理完成，归档',
              createdById: user.id,
            },
          },
        },
      });

      return redirect(`/hazards/${id}`);
    }

    case 'addPhoto': {
      const photoUrl = formData.get('photoUrl') as string;
      const photoType = formData.get('photoType') as PhotoType;
      const photoDescription = formData.get('photoDescription') as string;

      if (!photoUrl || !photoType) {
        return json<ActionError>({ error: '请填写照片信息', errorType: 'photo' }, { status: 400 });
      }

      const canUploadType = getAllowPhotoTypes(user.role, hazard.status, user.id === hazard.reporterId, user.id === hazard.assigneeId);
      
      if (!canUploadType.includes(photoType)) {
        return json<ActionError>({ 
          error: `您当前角色无权上传${photoType === 'BEFORE' ? '整改前' : photoType === 'AFTER' ? '整改后' : '复查'}照片`,
          errorType: 'photo' 
        }, { status: 403 });
      }

      await prisma.photo.create({
        data: {
          hazardId: id,
          type: photoType,
          url: photoUrl,
          description: photoDescription,
          uploadedById: user.id,
        },
      });

      return redirect(`/hazards/${id}`);
    }
  }

  return json<ActionError>({ error: '未知操作' }, { status: 400 });
};

function getAllowPhotoTypes(
  userRole: UserRole,
  hazardStatus: HazardStatus,
  isReporter: boolean,
  isAssignee: boolean
): PhotoType[] {
  const allowed: PhotoType[] = [];

  if (userRole === 'INSPECTOR' && isReporter && ['REPORTED'].includes(hazardStatus)) {
    allowed.push('BEFORE');
  }

  if (userRole === 'PROPERTY_MANAGER' && isAssignee && ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(hazardStatus)) {
    allowed.push('AFTER');
  }

  if (userRole === 'FIRE_VERIFIER' && ['SUBMITTED', 'PASSED', 'REJECTED'].includes(hazardStatus)) {
    allowed.push('INSPECTION');
  }

  return allowed;
}

function getStatusBadge(status: HazardStatus | string) {
  const styles: Record<string, string> = {
    REPORTED: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    SUBMITTED: 'bg-orange-100 text-orange-800',
    PASSED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    REPORTED: '已登记',
    ASSIGNED: '已派发',
    IN_PROGRESS: '整改中',
    SUBMITTED: '待验收',
    PASSED: '已通过',
    REJECTED: '需重改',
    ARCHIVED: '已归档',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}

function getLevelBadge(level: string) {
  const styles: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    CRITICAL: '紧急',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function HazardDetail() {
  const { user, hazard, propertyManagers, hasResponsibilityMismatch, mismatchReason } = useLoaderData<SerializeFrom<LoaderData>>();
  const actionData = useActionData<ActionError>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);

  const canAssign = user.role === 'FIRE_VERIFIER' && hazard.status === 'REPORTED';
  const canStart = user.role === 'PROPERTY_MANAGER' && hazard.assigneeId === user.id && hazard.status === 'ASSIGNED';
  const canSubmit = user.role === 'PROPERTY_MANAGER' && hazard.assigneeId === user.id && ['IN_PROGRESS', 'REJECTED'].includes(hazard.status);
  const canVerify = user.role === 'FIRE_VERIFIER' && hazard.status === 'SUBMITTED';
  const canArchive = user.role === 'FIRE_VERIFIER' && hazard.status === 'PASSED';
  
  const allowPhotoTypes = getAllowPhotoTypes(
    user.role as UserRole,
    hazard.status as HazardStatus,
    user.id === hazard.reporter.id,
    user.id === hazard.assignee?.id
  );
  const canAddPhoto = hazard.status !== 'ARCHIVED' && allowPhotoTypes.length > 0;

  const hasBeforePhoto = hazard.photos.some((p) => p.type === 'BEFORE');
  const hasAfterPhoto = hazard.photos.some((p) => p.type === 'AFTER');

  const getPhotoTypeLabel = (type: string) => {
    switch (type) {
      case 'BEFORE': return '整改前';
      case 'AFTER': return '整改后';
      case 'INSPECTION': return '复查';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-500 hover:text-gray-700">
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">隐患详情</h1>
        {getStatusBadge(hazard.status)}
      </div>

      {hasResponsibilityMismatch && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl">⚠️</span>
            <div>
              <p className="font-medium text-amber-800">责任异常提示</p>
              <p className="text-sm text-amber-700">{mismatchReason}</p>
            </div>
          </div>
        </div>
      )}

      {actionData?.error && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${
          actionData.errorType === 'verify' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
          'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="font-medium">{actionData.error}</p>
          {actionData.missingPhotos && (
            <p className="text-sm mt-1">提示：{actionData.missingPhotos}，请在下方补充照片</p>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{hazard.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  {getLevelBadge(hazard.level)}
                  <span className="text-sm text-gray-500">来源：{hazard.source}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">位置：</span>
                  <span className="text-gray-800">{hazard.location}</span>
                </div>
                <div>
                  <span className="text-gray-500">登记人：</span>
                  <span className="text-gray-800">{hazard.reporter.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">登记时间：</span>
                  <span className="text-gray-800">
                    {new Date(hazard.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">当前责任人：</span>
                  <span className="text-gray-800">{hazard.assignee?.name || '待派发'}</span>
                  {hazard.assignee && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({hazard.assignee.role === 'INSPECTOR' ? '巡检员' :
                        hazard.assignee.role === 'PROPERTY_MANAGER' ? '物业' :
                        hazard.assignee.role === 'FIRE_VERIFIER' ? '消防' : hazard.assignee.role})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">隐患描述</h4>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{hazard.description}</p>
              </div>
            </div>
          </div>

          {hazard.rectification && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">整改信息</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">整改措施</h4>
                  <p className="text-gray-800 bg-blue-50 p-3 rounded-lg">{hazard.rectification.measure}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">整改材料：</span>
                    <span className="text-gray-800">{hazard.rectification.materials || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">整改期限：</span>
                    <span className="text-gray-800">
                      {new Date(hazard.rectification.deadline).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {hazard.rectification.submittedAt && (
                    <div>
                      <span className="text-gray-500">提交时间：</span>
                      <span className="text-gray-800">
                        {new Date(hazard.rectification.submittedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                  {hazard.rectification.verifiedAt && (
                    <div>
                      <span className="text-gray-500">验收时间：</span>
                      <span className="text-gray-800">
                        {new Date(hazard.rectification.verifiedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">证据照片</h2>
              {canAddPhoto && (
                <button
                  onClick={() => setShowPhotoForm(!showPhotoForm)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  + 添加照片
                </button>
              )}
            </div>

            {showPhotoForm && (
              <Form method="post" className="mb-4 p-4 bg-gray-50 rounded-lg">
                <input type="hidden" name="_action" value="addPhoto" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      照片类型
                    </label>
                    <select
                      name="photoType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {allowPhotoTypes.map((type) => (
                        <option key={type} value={type}>
                          {getPhotoTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      您当前可上传：{allowPhotoTypes.map(t => getPhotoTypeLabel(t)).join('、')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      照片URL
                    </label>
                    <input
                      type="url"
                      name="photoUrl"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    照片说明
                  </label>
                  <input
                    type="text"
                    name="photoDescription"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="照片描述"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    上传
                  </button>
                </div>
              </Form>
            )}

            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 text-xs rounded ${hasBeforePhoto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                整改前照片：{hasBeforePhoto ? '✓ 已上传' : '✗ 缺失'}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${hasAfterPhoto ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                整改后照片：{hasAfterPhoto ? '✓ 已上传' : '○ 待上传'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hazard.photos.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center py-8">暂无照片</p>
              ) : (
                hazard.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.description || '照片'}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${photo.id}/400/300`;
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        photo.type === 'BEFORE' ? 'bg-yellow-500' :
                        photo.type === 'AFTER' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {getPhotoTypeLabel(photo.type)}
                      </span>
                      <p className="mt-1 truncate">{photo.description}</p>
                      <p className="text-gray-300 text-xs">{photo.uploadedBy.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">状态流转记录</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {hazard.statusTransitions.map((transition) => (
                  <div key={transition.id} className="relative pl-10">
                    <div className="absolute left-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow"></div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(transition.toStatus)}
                        <span className="text-xs text-gray-500">
                          {transition.createdBy.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(transition.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {transition.remark && (
                        <p className="text-sm text-gray-600">{transition.remark}</p>
                      )}
                      {transition.fromStatus && (
                        <p className="text-xs text-gray-400 mt-1">
                          {transition.fromStatus} → {transition.toStatus}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">操作</h2>
            <div className="space-y-3">
              {canAssign && (
                <>
                  <button
                    onClick={() => setShowAssignForm(!showAssignForm)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    派发整改任务
                  </button>
                  {showAssignForm && (
                    <Form method="post" className="p-4 bg-gray-50 rounded-lg">
                      <input type="hidden" name="_action" value="assign" />
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            责任单位
                          </label>
                          <select
                            name="assigneeId"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">选择责任人</option>
                            {propertyManagers.map((pm) => (
                              <option key={pm.id} value={pm.id}>
                                {pm.name} ({pm.department})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            整改措施
                          </label>
                          <textarea
                            name="measure"
                            required
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                            placeholder="请描述整改要求"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            整改材料
                          </label>
                          <input
                            type="text"
                            name="materials"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="所需材料"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            整改期限
                          </label>
                          <input
                            type="date"
                            name="deadline"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            备注
                          </label>
                          <input
                            type="text"
                            name="remark"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="派发说明"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAssignForm(false)}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            确认派发
                          </button>
                        </div>
                      </div>
                    </Form>
                  )}
                </>
              )}

              {canStart && (
                <Form method="post">
                  <input type="hidden" name="_action" value="start" />
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    开始整改
                  </button>
                </Form>
              )}

              {canSubmit && (
                <>
                  <button
                    onClick={() => setShowSubmitForm(!showSubmitForm)}
                    className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    提交整改申请
                  </button>
                  {showSubmitForm && (
                    <Form method="post" className="p-4 bg-gray-50 rounded-lg">
                      <input type="hidden" name="_action" value="submit" />
                      <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded">
                          ⚠️ 必须上传整改后照片才能提交验收
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            整改后照片URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="url"
                            name="photoUrl"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            照片说明
                          </label>
                          <input
                            type="text"
                            name="photoDescription"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="整改后情况描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            整改说明
                          </label>
                          <input
                            type="text"
                            name="remark"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="整改完成情况说明"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowSubmitForm(false)}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                          >
                            提交申请
                          </button>
                        </div>
                      </div>
                    </Form>
                  )}
                </>
              )}

              {canVerify && (
                <>
                  <button
                    onClick={() => setShowVerifyForm(!showVerifyForm)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    验收确认
                  </button>
                  {showVerifyForm && (
                    <Form method="post" className="p-4 bg-gray-50 rounded-lg">
                      <input type="hidden" name="_action" value="verify" />
                      <div className="space-y-3">
                        {(!hasBeforePhoto || !hasAfterPhoto) && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded">
                            ⚠️ 照片不完整：{!hasBeforePhoto && '缺少整改前照片 '}{!hasAfterPhoto && '缺少整改后照片'}
                            <br />照片缺失时无法通过验收
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            验收结果
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="verifyResult"
                                value="pass"
                                defaultChecked
                                className="text-green-600"
                                disabled={!hasBeforePhoto || !hasAfterPhoto}
                              />
                              <span className="text-sm">通过</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="verifyResult"
                                value="reject"
                                className="text-red-600"
                              />
                              <span className="text-sm">退回整改</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            验收意见
                          </label>
                          <textarea
                            name="remark"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                            placeholder="请填写验收意见"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowVerifyForm(false)}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            确认
                          </button>
                        </div>
                      </div>
                    </Form>
                  )}
                </>
              )}

              {canArchive && (
                <Form method="post">
                  <input type="hidden" name="_action" value="archive" />
                  <button
                    type="submit"
                    className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    归档
                  </button>
                </Form>
              )}

              {!canAssign && !canStart && !canSubmit && !canVerify && !canArchive && (
                <p className="text-center text-gray-500 text-sm py-4">
                  当前状态下无可用操作
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">当前用户权限说明</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              {user.role === 'INSPECTOR' && (
                <>
                  <li>• 可登记新隐患</li>
                  <li>• 可查看隐患详情</li>
                  <li>• 登记阶段可上传整改前照片</li>
                </>
              )}
              {user.role === 'PROPERTY_MANAGER' && (
                <>
                  <li>• 可查看分配的隐患</li>
                  <li>• 可开始/提交整改</li>
                  <li>• 整改阶段可上传整改后照片</li>
                </>
              )}
              {user.role === 'FIRE_VERIFIER' && (
                <>
                  <li>• 可派发整改任务</li>
                  <li>• 可验收整改结果</li>
                  <li>• 验收阶段可上传复查照片</li>
                  <li>• 可归档已完成隐患</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
