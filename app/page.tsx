'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from './components/AppShell';
import {
  regulations,
  aiActions,
  type AIAction,
  type AIActionType,
  type AIActionStatus,
  type AIPriority,
} from './data/regulations';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TYPE_META: Record<AIActionType, { label: string; icon: string; color: string }> = {
  snippet_identified: { label: 'Snippet identified', icon: '🔍', color: 'bg-blue-100 text-blue-800' },
  mapping_suggested:  { label: 'Mapping suggested',  icon: '🔗', color: 'bg-indigo-100 text-indigo-800' },
  gap_detected:       { label: 'Gap detected',       icon: '⚠', color: 'bg-red-100 text-red-800' },
  change_impact:      { label: 'Change impact',      icon: '📜', color: 'bg-amber-100 text-amber-800' },
  action_recommended: { label: 'Action recommended',  icon: '💡', color: 'bg-emerald-100 text-emerald-800' },
  risk_flagged:       { label: 'Risk flagged',        icon: '🚩', color: 'bg-rose-100 text-rose-800' },
};

const PRIORITY_META: Record<AIPriority, { label: string; dot: string; order: number }> = {
  critical: { label: 'Critical', dot: 'bg-red-500', order: 0 },
  high:     { label: 'High',     dot: 'bg-orange-500', order: 1 },
  medium:   { label: 'Medium',   dot: 'bg-blue-500', order: 2 },
  low:      { label: 'Low',      dot: 'bg-gray-400', order: 3 },
};

const STATUS_STYLE: Record<AIActionStatus, string> = {
  pending:       'bg-yellow-100 text-yellow-800',
  approved:      'bg-green-100 text-green-800',
  rejected:      'bg-red-100 text-red-800',
  auto_approved: 'bg-sky-100 text-sky-800',
};

type FilterTab = 'pending' | 'all' | 'approved' | 'rejected';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const router = useRouter();
  const [actions, setActions] = useState<AIAction[]>(aiActions);
  const [filterTab, setFilterTab] = useState<FilterTab>('pending');
  const [typeFilter, setTypeFilter] = useState<AIActionType | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = useMemo(() => ({
    pending: actions.filter(a => a.status === 'pending').length,
    approved: actions.filter(a => a.status === 'approved' || a.status === 'auto_approved').length,
    rejected: actions.filter(a => a.status === 'rejected').length,
    all: actions.length,
  }), [actions]);

  const filtered = useMemo(() => {
    let list = actions;
    if (filterTab === 'pending') list = list.filter(a => a.status === 'pending');
    else if (filterTab === 'approved') list = list.filter(a => a.status === 'approved' || a.status === 'auto_approved');
    else if (filterTab === 'rejected') list = list.filter(a => a.status === 'rejected');
    if (typeFilter !== 'all') list = list.filter(a => a.type === typeFilter);
    return list.sort((a, b) => PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order);
  }, [actions, filterTab, typeFilter]);

  const handleApprove = useCallback((id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' as const } : a));
  }, []);

  const handleReject = useCallback((id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as const } : a));
  }, []);

  const handleApproveAll = useCallback(() => {
    const pendingIds = new Set(filtered.filter(a => a.status === 'pending').map(a => a.id));
    setActions(prev => prev.map(a => pendingIds.has(a.id) ? { ...a, status: 'approved' as const } : a));
  }, [filtered]);

  const pendingCritical = useMemo(
    () => actions.filter(a => a.status === 'pending' && a.priority === 'critical').length,
    [actions],
  );

  // stats cards
  const regsPending = regulations.filter(r => r.pendingActions > 0).length;
  const regsAnalyzing = regulations.filter(r => r.aiStatus === 'analyzing').length;
  const regsQueued = regulations.filter(r => r.aiStatus === 'pending_analysis').length;

  return (
    <AppShell activePage="dashboard">
      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              AI Compliance Copilot
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">AI continuously monitors your regulatory landscape. You approve the actions.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Pending approvals" value={counts.pending} accent="text-yellow-700" bg="bg-yellow-50 border-yellow-200" icon="⏳" />
          <StatCard label="Critical actions" value={pendingCritical} accent="text-red-700" bg="bg-red-50 border-red-200" icon="🔴" />
          <StatCard label="Regulations with pending actions" value={regsPending} accent="text-indigo-700" bg="bg-indigo-50 border-indigo-200" icon="📋" />
          <StatCard label="AI analyzing" value={regsAnalyzing + regsQueued} accent="text-sky-700" bg="bg-sky-50 border-sky-200" icon="🤖" subtitle={regsAnalyzing > 0 ? `${regsAnalyzing} in progress, ${regsQueued} queued` : `${regsQueued} queued`} />
        </div>

        {/* Regulation quick-links */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Regulations requiring attention</h2>
          <div className="flex flex-wrap gap-2">
            {regulations.filter(r => r.pendingActions > 0).map(r => (
              <button
                key={r.id}
                onClick={() => router.push(`/regulation/${r.id}`)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-red-300 hover:bg-red-50 transition-colors"
              >
                <span className="font-medium text-gray-900 truncate max-w-[240px]">{r.name}</span>
                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold w-6 h-6">
                  {r.pendingActions}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {([
              { key: 'pending', label: 'Pending', count: counts.pending },
              { key: 'all', label: 'All', count: counts.all },
              { key: 'approved', label: 'Approved', count: counts.approved },
              { key: 'rejected', label: 'Rejected', count: counts.rejected },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setFilterTab(t.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.label}
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${filterTab === t.key ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-600'}`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as AIActionType | 'all')}
              className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 pr-8"
            >
              <option value="all">All types</option>
              {(Object.entries(TYPE_META) as [AIActionType, typeof TYPE_META[AIActionType]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            {filterTab === 'pending' && counts.pending > 0 && (
              <button
                onClick={handleApproveAll}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-sm font-medium transition-colors"
              >
                Approve all ({filtered.filter(a => a.status === 'pending').length})
              </button>
            )}
          </div>
        </div>

        {/* Action feed */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <p className="text-gray-400 text-sm">No actions match this filter.</p>
            </div>
          ) : (
            filtered.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expanded === action.id}
                onToggle={() => setExpanded(expanded === action.id ? null : action.id)}
                onApprove={() => handleApprove(action.id)}
                onReject={() => handleReject(action.id)}
                onNavigate={() => router.push(`/regulation/${action.regulationId}`)}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent, bg, icon, subtitle }: {
  label: string; value: number; accent: string; bg: string; icon: string; subtitle?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ActionCard({ action, expanded, onToggle, onApprove, onReject, onNavigate }: {
  action: AIAction; expanded: boolean;
  onToggle: () => void; onApprove: () => void; onReject: () => void; onNavigate: () => void;
}) {
  const tm = TYPE_META[action.type];
  const pm = PRIORITY_META[action.priority];
  const isPending = action.status === 'pending';

  return (
    <div className={`rounded-xl border transition-all ${
      isPending ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/50'
    }`}>
      <div className="flex items-start gap-3 p-4">
        {/* Priority dot + type icon */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <span className={`w-2.5 h-2.5 rounded-full ${pm.dot}`} title={pm.label} />
          <span className="text-lg">{tm.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tm.color}`}>{tm.label}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[action.status]}`}>
              {action.status === 'auto_approved' ? 'Auto-approved' : action.status.charAt(0).toUpperCase() + action.status.slice(1)}
            </span>
            <span className="text-[11px] text-gray-400">{action.confidence}% confidence</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{action.title}</h3>
          <p className="text-xs text-gray-500 mb-1.5">{action.description}</p>
          <button onClick={onNavigate} className="text-[11px] text-red-700 hover:underline font-medium">
            {action.regulationName}
          </button>

          {/* Expanded reasoning */}
          {expanded && (
            <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Reasoning</p>
              <p className="text-xs text-gray-700 leading-relaxed">{action.reasoning}</p>
              {action.relatedObjects && action.relatedObjects.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-400">Related:</span>
                  {action.relatedObjects.map(obj => (
                    <span key={obj} className="inline-flex items-center rounded bg-gray-200 px-1.5 py-0.5 text-[11px] text-gray-700">{obj}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Show reasoning">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isPending && (
            <>
              <button onClick={onApprove} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Approve
              </button>
              <button onClick={onReject} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-700 hover:text-red-700 px-3 py-1.5 text-xs font-semibold transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
