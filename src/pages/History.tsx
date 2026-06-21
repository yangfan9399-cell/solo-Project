import { useEffect, useState } from 'react';
import { RotateCcw, Send, Play, ChevronDown, Tag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { RollbackDraft } from '@/types';

const rollbackStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'rgba(110, 168, 217, 0.15)', text: 'var(--accent-blue)', label: '草案' },
  pending_approval: { bg: 'rgba(233, 196, 106, 0.15)', text: 'var(--accent-amber)', label: '待审批' },
  approved: { bg: 'rgba(82, 183, 136, 0.15)', text: 'var(--accent-green)', label: '已批准' },
  rejected: { bg: 'rgba(231, 111, 81, 0.15)', text: 'var(--accent-red)', label: '已驳回' },
};

export default function History() {
  const {
    releaseHistory,
    rollbackDrafts,
    rules,
    loading,
    fetchReleaseHistory,
    fetchRollbackDrafts,
    fetchRules,
    createRollback,
    submitRollback,
    executeRollback,
  } = useStore();

  const [showCreateRollback, setShowCreateRollback] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [rollbackComment, setRollbackComment] = useState('');
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReleaseHistory();
    fetchRollbackDrafts();
    fetchRules();
  }, [fetchReleaseHistory, fetchRollbackDrafts, fetchRules]);

  const publishedRules = rules.filter((r) => r.status === 'published');

  const handleCreateRollback = async () => {
    if (!selectedRuleId) return;
    await createRollback(selectedRuleId);
    setShowCreateRollback(false);
    setSelectedRuleId('');
  };

  const handleExecuteRollback = async (id: string) => {
    if (!rollbackComment.trim()) return;
    setExecutingId(id);
    try {
      await executeRollback(id, rollbackComment.trim());
      setRollbackComment('');
    } finally {
      setExecutingId(null);
    }
  };

  if (loading.history && loading.rollback) {
    return (
      <div className="flex items-center justify-center h-96">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-green)' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          发布历史
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          版本发布记录与回滚管理
        </p>
      </div>

      <section className="mb-10">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          发布历史
        </h3>
        {releaseHistory.length === 0 ? (
          <div
            className="text-center py-10 rounded-xl border text-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            暂无发布记录
          </div>
        ) : (
          <div className="relative pl-8">
            <div
              className="absolute left-3 top-0 bottom-0 w-0.5"
              style={{ background: 'var(--border)' }}
            />
            <div className="space-y-3">
              {releaseHistory.map((entry, idx) => (
                <div key={entry.id} className="relative">
                  <div
                    className="absolute -left-5 top-4 w-3 h-3 rounded-full border-2"
                    style={{
                      background: idx === 0 ? 'var(--accent-green)' : 'var(--border)',
                      borderColor: 'var(--bg-primary)',
                    }}
                  />
                  <div
                    className="rounded-xl border p-4"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-3.5 h-3.5" style={{ color: 'var(--accent-green)' }} />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {entry.version}
                      </span>
                      {idx === 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(82, 183, 136, 0.15)',
                            color: 'var(--accent-green)',
                          }}
                        >
                          当前版本
                        </span>
                      )}
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                        {entry.publishedAt}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {entry.changeSummary}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      关联审批: {entry.approvalId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            回滚草案
          </h3>
          <button
            onClick={() => setShowCreateRollback(!showCreateRollback)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-default"
            style={{ background: 'var(--accent-green)', color: '#0D1B16' }}
          >
            <RotateCcw className="w-4 h-4" />
            新建回滚
          </button>
        </div>

        {showCreateRollback && (
          <div
            className="rounded-xl border p-4 mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              选择回滚目标版本
            </h4>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-default"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">选择版本...</option>
              {publishedRules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.version}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCreateRollback}
                disabled={!selectedRuleId}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-default disabled:opacity-40"
                style={{ background: 'var(--accent-green)', color: '#0D1B16' }}
              >
                创建
              </button>
              <button
                onClick={() => setShowCreateRollback(false)}
                className="px-4 py-2 rounded-lg text-sm transition-default"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {rollbackDrafts.length === 0 ? (
          <div
            className="text-center py-10 rounded-xl border text-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            暂无回滚草案
          </div>
        ) : (
          <div className="space-y-3">
            {rollbackDrafts.map((draft) => (
              <RollbackCard
                key={draft.id}
                draft={draft}
                onSumbit={submitRollback}
                onExecute={handleExecuteRollback}
                comment={rollbackComment}
                onCommentChange={setRollbackComment}
                executing={executingId === draft.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RollbackCard({
  draft,
  onSumbit,
  onExecute,
  comment,
  onCommentChange,
  executing,
}: {
  draft: RollbackDraft;
  onSumbit: (id: string) => Promise<void>;
  onExecute: (id: string) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  executing: boolean;
}) {
  const cfg = rollbackStatusConfig[draft.status];

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            回滚至 {draft.targetVersion}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.text }}
          >
            {cfg.label}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {draft.createdAt}
        </span>
      </div>

      <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        <span>
          通过→警告: <b style={{ color: 'var(--accent-amber)' }}>{draft.impactSummary.toWarn}</b>
        </span>
        <span>
          通过→阻断: <b style={{ color: 'var(--accent-red)' }}>{draft.impactSummary.toBlock}</b>
        </span>
        <span>
          警告→阻断: <b style={{ color: 'var(--accent-red)' }}>{draft.impactSummary.warnToBlock}</b>
        </span>
      </div>

      <div className="flex gap-2">
        {draft.status === 'draft' && (
          <button
            onClick={() => onSumbit(draft.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-default"
            style={{ background: 'var(--accent-amber)', color: '#0D1B16' }}
          >
            <Send className="w-3.5 h-3.5" />
            提交审批
          </button>
        )}
        {draft.status === 'approved' && (
          <>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="输入回滚说明..."
              rows={1}
              className="flex-1 rounded-lg px-3 py-1.5 text-xs resize-none outline-none transition-default"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={() => onExecute(draft.id)}
              disabled={executing || !comment.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-default disabled:opacity-40"
              style={{ background: 'var(--accent-red)', color: '#fff' }}
            >
              <Play className="w-3.5 h-3.5" />
              执行回滚
            </button>
          </>
        )}
      </div>
    </div>
  );
}
