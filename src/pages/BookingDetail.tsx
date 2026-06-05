import { useState } from 'react';
import { useNavigate, useLoaderData, Form } from 'react-router-dom';
import { formatDateTime, formatCurrency, getStatusText, getStatusColor, getConflictTypeText, getConflictTypeColor, getRoleText, formatDate, formatTime } from '../utils/format';
import { BookingStatus, ConflictType, Booking, MeetingRoom } from '../types';
import { checkConflict } from '../api/client';

function BookingDetail() {
  const navigate = useNavigate();
  const { booking, meetingRooms } = useLoaderData() as { booking: Booking, meetingRooms: MeetingRoom[] };

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveOption, setResolveOption] = useState<'room' | 'time'>('room');
  const [newRoomId, setNewRoomId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [conflictCheck, setConflictCheck] = useState<{ hasConflict: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!booking) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gray-500">预订记录不存在</div>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  const isTimeOverlap = booking.conflictType === ConflictType.TIME_OVERLAP;
  const allCostsConfirmed = booking.costAllocations.every((c) => c.confirmed);

  const checkNewConflict = async () => {
    setFormError(null);
    if (resolveOption === 'room' && newRoomId) {
      const start = booking.startTime instanceof Date ? booking.startTime.toISOString() : new Date(booking.startTime).toISOString();
      const end = booking.endTime instanceof Date ? booking.endTime.toISOString() : new Date(booking.endTime).toISOString();
      const conflict = await checkConflict(newRoomId, start, end, booking.id);
      setConflictCheck(conflict.hasConflict ? { hasConflict: true, message: conflict.reason } : null);
    } else if (resolveOption === 'time' && newDate && newStartTime && newEndTime) {
      const start = `${newDate}T${newStartTime}`;
      const end = `${newDate}T${newEndTime}`;
      const conflict = await checkConflict(booking.meetingRoomId, start, end, booking.id);
      setConflictCheck(conflict.hasConflict ? { hasConflict: true, message: conflict.reason } : null);
    }
  };

  const validateResolveForm = () => {
    if (resolveOption === 'room') {
      if (!newRoomId) {
        setFormError('请选择新的会议室');
        return false;
      }
    } else {
      if (!newDate || !newStartTime || !newEndTime) {
        setFormError('请填写完整的日期和时间');
        return false;
      }
      if (newStartTime >= newEndTime) {
        setFormError('结束时间必须晚于开始时间');
        return false;
      }
    }
    if (conflictCheck?.hasConflict) {
      setFormError('仍存在时间冲突，请调整后再提交');
      return false;
    }
    setFormError(null);
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{booking.title}</h2>
          <p className="mt-1 text-sm text-gray-500">预订编号: {booking.id}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </span>
          {booking.conflictType !== ConflictType.NONE && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConflictTypeColor(booking.conflictType)}`}>
              {getConflictTypeText(booking.conflictType)}
            </span>
          )}
        </div>
      </div>

      {booking.status === BookingStatus.CONFLICT && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2 text-xl">⚠️</span>
              <div>
                <div className="font-medium text-red-800">冲突提示</div>
                <div className="text-red-700 text-sm">{booking.conflictReason}</div>
              </div>
            </div>
            {isTimeOverlap && (
              <button onClick={() => setShowResolveModal(true)} className="btn btn-primary">
                解决冲突
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">会议室信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">会议室名称</div>
                <div className="text-lg font-medium text-gray-900">{booking.meetingRoom?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">所在楼层</div>
                <div className="text-lg font-medium text-gray-900">{booking.meetingRoom?.floor}楼</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">容纳人数</div>
                <div className="text-lg font-medium text-gray-900">{booking.meetingRoom?.capacity}人</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">小时费用</div>
                <div className="text-lg font-medium text-gray-900">{formatCurrency(booking.meetingRoom?.hourlyRate || 0)}</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">时间段</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">日期</div>
                <div className="text-lg font-medium text-gray-900">{formatDate(booking.startTime)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">开始时间</div>
                <div className="text-lg font-medium text-gray-900">{formatTime(booking.startTime)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">结束时间</div>
                <div className="text-lg font-medium text-gray-900">{formatTime(booking.endTime)}</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">设备清单</h3>
            <div className="flex flex-wrap gap-3">
              {booking.bookingEquipments.map((eq) => (
                <div
                  key={eq.id}
                  className={`px-4 py-2 rounded-lg border ${
                    eq.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <span className={eq.available ? 'text-green-700' : 'text-red-700'}>{eq.name}</span>
                  {!eq.available && <span className="ml-2 text-red-500 text-sm">(不可用)</span>}
                </div>
              ))}
            </div>
            {booking.equipmentNotes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">设备说明</div>
                <div className="text-gray-700">{booking.equipmentNotes}</div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">流转记录</h3>
            <div className="space-y-4">
              {booking.flowRecords.map((record, index) => (
                <div key={record.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    {index < booking.flowRecords.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{record.action}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {getRoleText(record.role)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      操作人: {record.operator} · {formatDateTime(record.createdAt)}
                    </div>
                    {record.remark && <div className="text-sm text-gray-600 mt-1">{record.remark}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">责任部门</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-500">申请部门</div>
              <div className="text-lg font-medium text-gray-900">{booking.department?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">经办人</div>
              <div className="text-lg font-medium text-gray-900">{booking.applicant}</div>
              <div className="text-sm text-gray-500">{getRoleText(booking.applicantRole)}</div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">费用分摊</h3>
            <div className="space-y-4">
              {booking.costAllocations.map((alloc) => (
                <div key={alloc.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{alloc.department?.name}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alloc.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {alloc.confirmed ? '已确认' : '待确认'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">分摊比例: {alloc.percentage}%</span>
                    <span className="font-medium text-gray-900">{formatCurrency(alloc.amount)}</span>
                  </div>
                  {!alloc.confirmed && (
                    <Form method="post" className="mt-3">
                      <input type="hidden" name="action" value="confirmCost" />
                      <input type="hidden" name="allocationId" value={alloc.id} />
                      <input type="hidden" name="confirmedBy" value="部门负责人" />
                      <button type="submit" className="w-full btn btn-success text-sm py-1.5">
                        部门负责人确认
                      </button>
                    </Form>
                  )}
                  {alloc.confirmed && alloc.confirmedBy && (
                    <div className="mt-2 text-xs text-gray-500">
                      确认人: {alloc.confirmedBy} · {formatDateTime(alloc.confirmedAt!)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-gray-600">总费用</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(booking.totalCost)}</span>
            </div>
          </div>

          <div className="card p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">操作</h3>
            
            {booking.status === BookingStatus.PENDING && allCostsConfirmed && (
              <>
                <Form method="post">
                  <input type="hidden" name="action" value="confirm" />
                  <button type="submit" className="w-full btn btn-success mb-3">
                    ✓ 复核通过
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="action" value="reject" />
                  <button type="submit" className="w-full btn btn-danger">
                    ✗ 拒绝预订
                  </button>
                </Form>
              </>
            )}

            {booking.status === BookingStatus.PENDING && !allCostsConfirmed && (
              <div className="text-center py-2 text-yellow-600 text-sm">
                请等待所有部门确认费用后再进行复核
              </div>
            )}

            {booking.status === BookingStatus.CONFLICT && (
              <div className="text-center py-2 text-red-600 text-sm">
                存在冲突，请先解决冲突后再进行后续操作
              </div>
            )}

            {(booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.REJECTED) && (
              <Form method="post">
                <input type="hidden" name="action" value="archive" />
                <button type="submit" className="w-full btn btn-secondary">
                  📦 归档记录
                </button>
              </Form>
            )}

            <button onClick={() => navigate('/')} className="w-full btn btn-secondary mt-3">
              ← 返回列表
            </button>
          </div>
        </div>
      </div>

      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">解决时间冲突</h3>
            
            <div className="flex space-x-2 mb-6">
              <button
                type="button"
                onClick={() => setResolveOption('room')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  resolveOption === 'room'
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                🔄 更换会议室
              </button>
              <button
                type="button"
                onClick={() => setResolveOption('time')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  resolveOption === 'time'
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                🕐 调整时间
              </button>
            </div>

            <Form method="post" onSubmit={(e) => {
              if (!validateResolveForm()) {
                e.preventDefault();
              }
            }}>
              <input type="hidden" name="action" value="resolveConflict" />
              
              {resolveOption === 'room' ? (
                <div className="mb-6">
                  <label className="label">选择新会议室</label>
                  <select
                    name="newMeetingRoomId"
                    className="input"
                    value={newRoomId}
                    onChange={(e) => {
                      setNewRoomId(e.target.value);
                      setTimeout(checkNewConflict, 100);
                    }}
                  >
                    <option value="">请选择会议室</option>
                    {meetingRooms
                      .filter((r) => r.id !== booking.meetingRoomId)
                      .map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {room.floor}楼 ({room.capacity}人, ¥{room.hourlyRate}/小时)
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="label">新日期</label>
                    <input
                      type="date"
                      name="newDate"
                      className="input"
                      value={newDate}
                      onChange={(e) => {
                        setNewDate(e.target.value);
                        setTimeout(checkNewConflict, 100);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">开始时间</label>
                      <input
                        type="time"
                        name="newStartTime"
                        className="input"
                        value={newStartTime}
                        onChange={(e) => {
                          setNewStartTime(e.target.value);
                          setTimeout(checkNewConflict, 100);
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">结束时间</label>
                      <input
                        type="time"
                        name="newEndTime"
                        className="input"
                        value={newEndTime}
                        onChange={(e) => {
                          setNewEndTime(e.target.value);
                          setTimeout(checkNewConflict, 100);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-700 text-sm">⚠️ {formError}</span>
                </div>
              )}

              {conflictCheck && !formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-700 text-sm">⚠️ {conflictCheck.message}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false);
                    setFormError(null);
                    setConflictCheck(null);
                    setNewRoomId('');
                    setNewDate('');
                    setNewStartTime('');
                    setNewEndTime('');
                  }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={conflictCheck?.hasConflict}
                >
                  确认调整
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingDetail;
