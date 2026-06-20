import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, User, FileText, RotateCcw, Shield, Eye, PlusCircle } from 'lucide-react';
import ScrollCard from '../components/common/ScrollCard';
import BambooDivider from '../components/common/BambooDivider';
import { useAppStore } from '../store';
import { formatDate, formatRelativeTime } from '../utils/format';
import { cn } from '../lib/utils';

const actionTypes = [
  { value: 'all', label: '全部', icon: FileText, color: 'text-ochre-600' },
  { value: 'publish', label: '发布', icon: FileText, color: 'text-bronze-600' },
  { value: 'rollback', label: '回滚', icon: RotateCcw, color: 'text-cinnabar-600' },
  { value: 'resolve', label: '阻断解决', icon: Shield, color: 'text-stoneBlue-600' },
  { value: 'audit', label: '审核', icon: Eye, color: 'text-ochre-600' },
  { value: 'create', label: '创建', icon: PlusCircle, color: 'text-bronze-600' },
];

const actionColorMap: Record<string, { bg: string; text: string; border: string }> = {
  '版本发布': { bg: 'bg-bronze-50', text: 'text-bronze-700', border: 'border-bronze-300' },
  '发布审批通过': { bg: 'bg-bronze-50', text: 'text-bronze-700', border: 'border-bronze-300' },
  '阻断项创建': { bg: 'bg-cinnabar-50', text: 'text-cinnabar-700', border: 'border-cinnabar-300' },
  '阻断项解决': { bg: 'bg-stoneBlue-50', text: 'text-stoneBlue-700', border: 'border-stoneBlue-300' },
  '版本状态变更': { bg: 'bg-ochre-50', text: 'text-ochre-700', border: 'border-ochre-300' },
  '版本创建': { bg: 'bg-bronze-50', text: 'text-bronze-700', border: 'border-bronze-300' },
  '样本锁定': { bg: 'bg-ochre-50', text: 'text-ochre-700', border: 'border-ochre-300' },
  '草稿创建': { bg: 'bg-ink-50', text: 'text-ink-600', border: 'border-ink-300' },
  '回滚草案创建': { bg: 'bg-cinnabar-50', text: 'text-cinnabar-700', border: 'border-cinnabar-300' },
};

const BambooSlip: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}> = ({ children, className, onClick, clickable = false }) => {
  return (
    <div
      className={cn(
        'relative bg-gradient-to-b from-paper-50 to-paper-100 rounded border border-ochre-200',
        'shadow-sm hover:shadow-md transition-all duration-300',
        clickable && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
      onClick={clickable ? onClick : undefined}
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 24px,
            rgba(217, 176, 131, 0.15) 24px,
            rgba(217, 176, 131, 0.15) 25px
          )
        `,
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ochre-300 via-ochre-400 to-ochre-300 rounded-l" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ochre-300 via-ochre-400 to-ochre-300 rounded-r" />
      <div className="relative pl-4 pr-4 py-3">
        {children}
      </div>
    </div>
  );
};

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'md' }) => {
  const colors = ['#B56D32', '#4A7C59', '#2C5F8C', '#C23B22', '#6B4423'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-song font-medium text-white',
        sizeClasses[size]
      )}
      style={{
        backgroundColor: color,
        boxShadow: `0 2px 8px ${color}40`,
      }}
    >
      {name.charAt(0)}
    </div>
  );
};

const AuditLog: React.FC = () => {
  const { auditLogs, packages, fetchPackageAuditLogs, fetchPackages } = useAppStore();
  const [actionType, setActionType] = useState('all');
  const [operator, setOperator] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    if (packages.length > 0) {
      packages.forEach(pkg => {
        fetchPackageAuditLogs(pkg.id);
      });
    }
  }, [packages.length, fetchPackageAuditLogs]);

  const allOperators = useMemo(() => {
    const operators = new Set(auditLogs.map(log => log.operator));
    return Array.from(operators);
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    let result = [...auditLogs];

    if (actionType !== 'all') {
      const typeMap: Record<string, string[]> = {
        publish: ['版本发布', '发布审批通过'],
        rollback: ['回滚草案创建'],
        resolve: ['阻断项解决'],
        audit: ['版本状态变更'],
        create: ['版本创建', '草稿创建', '阻断项创建', '样本锁定'],
      };
      const actions = typeMap[actionType] || [];
      result = result.filter(log => actions.includes(log.action));
    }

    if (operator !== 'all') {
      result = result.filter(log => log.operator === operator);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.description.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.operator.toLowerCase().includes(query)
      );
    }

    if (dateRange.start) {
      result = result.filter(log => new Date(log.timestamp) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.timestamp) <= endDate);
    }

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return result;
  }, [auditLogs, actionType, operator, searchQuery, dateRange]);

  const totalCount = auditLogs.length;
  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return auditLogs.filter(log => new Date(log.timestamp) >= today).length;
  }, [auditLogs]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getPackageName = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg?.name || packageId;
  };

  const getActionColor = (action: string) => {
    return actionColorMap[action] || { bg: 'bg-ochre-50', text: 'text-ochre-700', border: 'border-ochre-300' };
  };

  const formatDetails = (details?: Record<string, unknown>) => {
    if (!details) return null;
    return Object.entries(details).map(([key, value]) => {
      const labelMap: Record<string, string> = {
        fromVersion: '从版本',
        toVersion: '到版本',
        affectedSamples: '影响样本',
        approvalType: '审批类型',
        version: '版本',
        blockerId: '阻断项ID',
        severity: '严重程度',
        fromStatus: '原状态',
        toStatus: '新状态',
        reason: '原因',
        changeLogCount: '变更项数',
        sampleId: '样本ID',
        status: '状态',
        resolution: '解决方案',
        improvement: '改进效果',
        rollbackId: '回滚ID',
        targetVersion: '目标版本',
      };
      return {
        label: labelMap[key] || key,
        value: String(value),
      };
    });
  };

  return (
    <div className="min-h-screen bg-paper-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-song font-bold text-ochre-800 mb-2">
            审计日志
          </h1>
          <p className="text-ochre-500 text-sm">记录所有操作历史，可追溯可核查</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ScrollCard>
            <div className="text-center">
              <div className="font-song font-bold text-2xl text-ochre-800">{totalCount}</div>
              <div className="text-ochre-500 text-sm mt-1">总记录数</div>
            </div>
          </ScrollCard>
          <ScrollCard>
            <div className="text-center">
              <div className="font-song font-bold text-2xl text-bronze-600">{todayCount}</div>
              <div className="text-ochre-500 text-sm mt-1">今日操作</div>
            </div>
          </ScrollCard>
          <ScrollCard>
            <div className="text-center">
              <div className="font-song font-bold text-2xl text-stoneBlue-600">{allOperators.length}</div>
              <div className="text-ochre-500 text-sm mt-1">操作人数</div>
            </div>
          </ScrollCard>
          <ScrollCard>
            <div className="text-center">
              <div className="font-song font-bold text-2xl text-cinnabar-600">{packages.length}</div>
              <div className="text-ochre-500 text-sm mt-1">涉及发布包</div>
            </div>
          </ScrollCard>
        </div>

        <BambooDivider withText={true} text="筛选条件" />

        <ScrollCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-song text-ochre-700 mb-2">
                操作类型
              </label>
              <select
                value={actionType}
                onChange={(e) => {
                  setActionType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded border border-ochre-200 bg-paper-50 text-ochre-700 text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:border-transparent"
              >
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-song text-ochre-700 mb-2">
                操作人
              </label>
              <select
                value={operator}
                onChange={(e) => {
                  setOperator(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded border border-ochre-200 bg-paper-50 text-ochre-700 text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:border-transparent"
              >
                <option value="all">全部</option>
                {allOperators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-song text-ochre-700 mb-2">
                日期范围
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ochre-400" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-2 py-2 rounded border border-ochre-200 bg-paper-50 text-ochre-700 text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:border-transparent"
                  />
                </div>
                <span className="text-ochre-400">至</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ochre-400" />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-2 py-2 rounded border border-ochre-200 bg-paper-50 text-ochre-700 text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-song text-ochre-700 mb-2">
                搜索
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ochre-400" />
                <input
                  type="text"
                  placeholder="搜索操作描述..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded border border-ochre-200 bg-paper-50 text-ochre-700 text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:border-transparent placeholder-ochre-300"
                />
              </div>
            </div>
          </div>
        </ScrollCard>

        <BambooDivider withText={true} text={`日志记录 (${filteredLogs.length}条)`} />

        <div className="space-y-3 mb-6">
          {paginatedLogs.length === 0 ? (
            <ScrollCard>
              <div className="text-center py-12 text-ochre-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-song">暂无符合条件的日志记录</p>
              </div>
            </ScrollCard>
          ) : (
            paginatedLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              const actionColor = getActionColor(log.action);
              const details = formatDetails(log.details);

              return (
                <BambooSlip
                  key={log.id}
                  clickable
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={log.operator} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border',
                            actionColor.bg,
                            actionColor.text,
                            actionColor.border
                          )}>
                            {log.action}
                          </span>
                          <span className="text-ochre-600 font-song font-medium">
                            {getPackageName(log.packageId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-ochre-400 text-xs">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-ochre-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-ochre-400" />
                          )}
                        </div>
                      </div>

                      <p className="text-ochre-700 text-sm mt-2">
                        {log.description}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-ochre-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.operator}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.timestamp)}
                        </span>
                      </div>

                      {isExpanded && details && details.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-ochre-100">
                          <div className="text-xs font-song text-ochre-600 mb-3">详细信息</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {details.map((item, idx) => (
                              <div key={idx} className="bg-ochre-50/50 rounded p-2">
                                <div className="text-xs text-ochre-500 mb-1">{item.label}</div>
                                <div className="text-sm text-ochre-700 font-medium">{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </BambooSlip>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded border transition-colors',
                currentPage === 1
                  ? 'border-ochre-200 text-ochre-300 cursor-not-allowed'
                  : 'border-ochre-300 text-ochre-600 hover:bg-ochre-50'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-10 h-10 rounded font-song text-sm transition-all',
                  currentPage === page
                    ? 'bg-ochre-600 text-white shadow-md'
                    : 'border border-ochre-200 text-ochre-600 hover:bg-ochre-50'
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded border transition-colors',
                currentPage === totalPages
                  ? 'border-ochre-200 text-ochre-300 cursor-not-allowed'
                  : 'border-ochre-300 text-ochre-600 hover:bg-ochre-50'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
