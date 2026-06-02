import { useState, useEffect } from 'react';
import { apiRequest, formatDateTime, getStatusText, getLevelText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import Modal from './Modal';

export default function SortingBoard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shelfLocation, setShelfLocation] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [completeModal, setCompleteModal] = useState(false);
  const [sendingTaskId, setSendingTaskId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest('/sorting/board');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStart = async (taskId) => {
    try {
      await apiRequest(`/sorting/${taskId}/start`, { method: 'PUT' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await apiRequest(`/sorting/${taskId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ shelf_location: shelfLocation[taskId] || '' })
      });
      setCompleteModal(false);
      setSelectedTask(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeliver = async (taskId) => {
    if (!confirm('确定要标记为已交付吗？')) return;
    try {
      await apiRequest(`/sorting/${taskId}/deliver`, { method: 'PUT' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateTasks = async (poItemId) => {
    try {
      await apiRequest('/sorting/generate', {
        method: 'POST',
        body: JSON.stringify({ po_item_id: poItemId })
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendNotification = async (task) => {
    if (!task.preorder_id) {
      alert('该任务没有关联的预售订单');
      return;
    }
    try {
      setSendingTaskId(task.id);
      const res = await apiRequest('/notifications/arrival', {
        method: 'POST',
        body: JSON.stringify({ preorder_id: task.preorder_id })
      });
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingTaskId(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">分拣看板</h1>
        <button onClick={loadData} className="btn btn-secondary">
          🔄 刷新
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">待处理</span>
            <span className={`status-badge status-pending`}>待处理</span>
          </div>
          <div className="text-3xl font-bold mt-2">
            {data.stats.find(s => s.status === 'pending')?.count || 0}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">分拣中</span>
            <span className={`status-badge status-sorting`}>分拣中</span>
          </div>
          <div className="text-3xl font-bold mt-2">
            {data.stats.find(s => s.status === 'sorting')?.count || 0}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">已分拣</span>
            <span className={`status-badge status-sorted`}>已分拣</span>
          </div>
          <div className="text-3xl font-bold mt-2">
            {data.stats.find(s => s.status === 'sorted')?.count || 0}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">已交付</span>
            <span className={`status-badge status-delivered`}>已交付</span>
          </div>
          <div className="text-3xl font-bold mt-2">
            {data.stats.find(s => s.status === 'delivered')?.count || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card">
          <div className="p-4 border-b bg-yellow-50">
            <h2 className="font-semibold text-yellow-800">⏳ 待处理 ({data.pending.length})</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {data.pending.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-gray-500">暂无待处理任务</div>
                <div className="text-xs text-gray-400 mt-1">所有任务都已完成</div>
              </div>
            ) : (
              data.pending.map(task => (
                <div key={task.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <span className={`status-badge level-${task.member_level}`}>
                      {getLevelText(task.member_level)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>会员：{task.member_name}</p>
                    <p>电话：{task.member_phone}</p>
                  </div>
                  <button
                    onClick={() => handleStart(task.id)}
                    className="w-full btn btn-primary btn-sm"
                  >
                    开始分拣
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b bg-purple-50">
            <h2 className="font-semibold text-purple-800">🔄 分拣中 ({data.sorting.length})</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {data.sorting.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">☕</div>
                <div className="text-gray-500">暂无分拣中任务</div>
                <div className="text-xs text-gray-400 mt-1">开始分拣后会显示在这里</div>
              </div>
            ) : (
              data.sorting.map(task => (
                <div key={task.id} className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <span className={`status-badge status-sorting`}>分拣中</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>会员：{task.member_name}</p>
                    <p>分拣员：{task.sorted_by_name}</p>
                    <p className="text-xs text-gray-400">开始时间：{formatDateTime(task.sorted_at)}</p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="货架位置（如：A-01-01）"
                      value={shelfLocation[task.id] || ''}
                      onChange={(e) => setShelfLocation({ ...shelfLocation, [task.id]: e.target.value })}
                      className="input text-sm"
                    />
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setCompleteModal(true);
                      }}
                      className="w-full btn btn-success btn-sm"
                    >
                      完成分拣
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b bg-green-50">
            <h2 className="font-semibold text-green-800">✅ 已分拣 ({data.sorted.length})</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {data.sorted.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-gray-500">暂无已分拣任务</div>
                <div className="text-xs text-gray-400 mt-1">分拣完成后会显示在这里</div>
              </div>
            ) : (
              data.sorted.map(task => (
                <div key={task.id} className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="flex items-center space-x-1">
                      {task.notification_sent ? (
                        <span className="status-badge status-sent text-xs" title="已发送取书通知">✉️</span>
                      ) : (
                        <span className="status-badge status-pending text-xs" title="未发送通知">⏳</span>
                      )}
                      <span className={`status-badge status-sorted`}>已分拣</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>会员：{task.member_name}</p>
                    <p>电话：{task.member_phone}</p>
                    <p>货架：<span className="font-mono bg-white px-2 py-0.5 rounded">{task.shelf_location}</span></p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSendNotification(task)}
                      disabled={sendingTaskId === task.id || task.notification_sent}
                      className="w-full btn btn-primary btn-sm"
                    >
                      {sendingTaskId === task.id ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⏳</span>
                          发送中...
                        </>
                      ) : task.notification_sent ? (
                        '✉️ 已发送通知'
                      ) : (
                        '📤 发送取书通知'
                      )}
                    </button>
                    <button
                      onClick={() => handleDeliver(task.id)}
                      className="w-full btn btn-secondary btn-sm"
                    >
                      确认交付
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={completeModal} onClose={() => setCompleteModal(false)} title="完成分拣">
        {selectedTask && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-1">{selectedTask.title}</div>
              <div className="text-sm text-gray-600">
                会员：{selectedTask.member_name}
              </div>
            </div>
            <div>
              <label className="label">货架位置</label>
              <input
                type="text"
                placeholder="如：A-01-01"
                value={shelfLocation[selectedTask.id] || ''}
                onChange={(e) => setShelfLocation({ ...shelfLocation, [selectedTask.id]: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setCompleteModal(false)} className="btn btn-secondary">
                取消
              </button>
              <button
                onClick={() => handleComplete(selectedTask.id)}
                className="btn btn-primary"
              >
                确认完成
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
