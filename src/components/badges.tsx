import { component$ } from '@builder.io/qwik';

export const SeverityBadge = component$<{ severity: 'low' | 'medium' | 'high' | 'critical' }>(({ severity }) => {
  const config = {
    low: { bg: 'bg-blue-900/50', text: 'text-blue-300', border: 'border-blue-700', label: '低' },
    medium: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-700', label: '中' },
    high: { bg: 'bg-orange-900/50', text: 'text-orange-300', border: 'border-orange-700', label: '高' },
    critical: { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-700', label: '严重' },
  };

  const c = config[severity];
  return (
    <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
      <span class={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.text.replace('text-', 'bg-')}`}></span>
      {c.label}
    </span>
  );
});

export const ModeBadge = component$<{ mode: 'ppl' | 'xpl' | 'cnl' }>(({ mode }) => {
  const config = {
    ppl: { bg: 'bg-mineral-700', text: 'text-mineral-100', label: '单偏光' },
    xpl: { bg: 'bg-polar-purple', text: 'text-purple-100', label: '正交偏光' },
    cnl: { bg: 'bg-polar-red', text: 'text-red-100', label: '锥光' },
  };

  const c = config[mode];
  return (
    <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
});

export const AnomalyBadge = component$<{ count: number }>(({ count }) => {
  if (count === 0) return null;
  
  const severity = count >= 3 ? 'critical' : count >= 2 ? 'high' : 'medium';
  const config = {
    low: 'bg-blue-600',
    medium: 'bg-yellow-600',
    high: 'bg-orange-600',
    critical: 'bg-red-600',
  };

  return (
    <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${config[severity]}`}>
      {count}
    </span>
  );
});

export const VersionBadge = component$<{ version: number; isLatest?: boolean }>(({ version, isLatest }) => {
  return (
    <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
      isLatest ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-mineral-700 text-mineral-200'
    }`}>
      v{version}
      {isLatest && <span class="text-[10px]">●</span>}
    </span>
  );
});
