import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import { waterQualityApi, usersApi } from '../services/api';
import { LoadingCard, ErrorState } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { Button, Modal, Input, TextArea, Select } from '../components/Modal';
import { formatDate } from '../utils/format';
import type { WaterQualityTest, User, RecheckRecord } from '../types';

export function WaterQualityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<(WaterQualityTest & { rechecks: RecheckRecord[] }) | null>(null);
  const [chemists, setChemists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecheckModalOpen, setIsRecheckModalOpen] = useState(false);
  const [recheckData, setRecheckData] = useState({
    ph: '',
    turbidity: '',
    residual_chlorine: '',
    coliform: '',
    remark: '',
    rechecked_by: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [testRes, usersRes] = await Promise.all([
          waterQualityApi.getById(id),
          usersApi.getAll(),
        ]);
        setTest(testRes.data);
        setChemists(usersRes.data.filter((u) => u.role === 'chemist'));
        setRecheckData((prev) => ({ ...prev, rechecked_by: usersRes.data.find((u) => u.role === 'chemist')?.id || '' }));
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleRecheck = async () => {
    if (!id) return;
    try {
      const chemist = chemists.find((c) => c.id === recheckData.rechecked_by);
      await waterQualityApi.recheck(id, {
        ...recheckData,
        recheck_date: new Date().toISOString(),
        ph: parseFloat(recheckData.ph),
        turbidity: parseFloat(recheckData.turbidity),
        residual_chlorine: parseFloat(recheckData.residual_chlorine),
        coliform: parseInt(recheckData.coliform),
        rechecker_name: chemist?.name,
      });
      const response = await waterQualityApi.getById(id);
      setTest(response.data);
      setIsRecheckModalOpen(false);
      setRecheckData({ ph: '', turbidity: '', residual_chlorine: '', coliform: '', remark: '', rechecked_by: chemists[0]?.id || '' });
    } catch (err) {
      alert('复测提交失败，请重试');
    }
  };

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!test) return <ErrorState message="检测记录不存在" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/water-quality')} className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">水质检测详情</h1>
        <StatusBadge status={test.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">检测地点</span>
              <span className="font-medium text-gray-900">{test.location_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">检测日期</span>
              <span className="text-gray-900">{test.test_date}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">检测人员</span>
              <span className="text-gray-900">{test.tester_name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">当前状态</span>
              <StatusBadge status={test.status} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">检测结果</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">pH值</span>
              <div className="flex items-center gap-2">
                <span className={test.ph < 6.5 || test.ph > 8.5 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {test.ph}
                </span>
                <span className="text-xs text-gray-400">(标准: 6.5-8.5)</span>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">浊度 (NTU)</span>
              <div className="flex items-center gap-2">
                <span className={test.turbidity > 1.0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {test.turbidity}
                </span>
                <span className="text-xs text-gray-400">(标准: ≤1.0)</span>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">余氯 (mg/L)</span>
              <div className="flex items-center gap-2">
                <span className={test.residual_chlorine < 0.3 || test.residual_chlorine > 4.0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {test.residual_chlorine}
                </span>
                <span className="text-xs text-gray-400">(标准: 0.3-4.0)</span>
              </div>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">大肠菌群 (MPN/100mL)</span>
              <div className="flex items-center gap-2">
                <span className={test.coliform > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {test.coliform}
                </span>
                <span className="text-xs text-gray-400">(标准: 不得检出)</span>
              </div>
            </div>
          </div>
          {test.remark && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-500 text-sm">备注：{test.remark}</span>
            </div>
          )}
        </div>
      </div>

      {(test.status === 'abnormal' || test.status === 'processing') && (
        <div className="flex justify-end gap-3">
          <Button onClick={() => setIsRecheckModalOpen(true)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            进行复测
          </Button>
        </div>
      )}

      {test.rechecks && test.rechecks.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">复测记录</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {test.rechecks.map((recheck) => (
                <div key={recheck.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {recheck.result === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="font-medium text-gray-900">复测结果</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={recheck.result} />
                      <span className="text-sm text-gray-500">{formatDate(recheck.recheck_date)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">pH: </span>{recheck.ph}</div>
                    <div><span className="text-gray-500">浊度: </span>{recheck.turbidity}</div>
                    <div><span className="text-gray-500">余氯: </span>{recheck.residual_chlorine}</div>
                    <div><span className="text-gray-500">大肠菌群: </span>{recheck.coliform}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">复测人员：{recheck.rechecker_name}</div>
                  {recheck.remark && (
                    <div className="mt-2 text-sm text-gray-500">备注：{recheck.remark}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isRecheckModalOpen} onClose={() => setIsRecheckModalOpen(false)} title="水质复测" size="lg">
        <div className="space-y-4">
          <Select
            label="复测人员"
            value={recheckData.rechecked_by}
            onChange={(e) => setRecheckData({ ...recheckData, rechecked_by: e.target.value })}
            options={chemists.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="pH值"
              type="number"
              step="0.1"
              value={recheckData.ph}
              onChange={(e) => setRecheckData({ ...recheckData, ph: e.target.value })}
              placeholder="范围：6.5-8.5"
            />
            <Input
              label="浊度 (NTU)"
              type="number"
              step="0.1"
              value={recheckData.turbidity}
              onChange={(e) => setRecheckData({ ...recheckData, turbidity: e.target.value })}
              placeholder="标准：≤1.0"
            />
            <Input
              label="余氯 (mg/L)"
              type="number"
              step="0.1"
              value={recheckData.residual_chlorine}
              onChange={(e) => setRecheckData({ ...recheckData, residual_chlorine: e.target.value })}
              placeholder="范围：0.3-4.0"
            />
            <Input
              label="大肠菌群 (MPN/100mL)"
              type="number"
              value={recheckData.coliform}
              onChange={(e) => setRecheckData({ ...recheckData, coliform: e.target.value })}
              placeholder="标准：不得检出"
            />
          </div>
          <TextArea
            label="备注"
            value={recheckData.remark}
            onChange={(e) => setRecheckData({ ...recheckData, remark: e.target.value })}
            rows={3}
            placeholder="请输入复测备注..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsRecheckModalOpen(false)}>取消</Button>
            <Button onClick={handleRecheck}>提交复测结果</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
