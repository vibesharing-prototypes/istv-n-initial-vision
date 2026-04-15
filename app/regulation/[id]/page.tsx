'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import {
  regulations, regulationDetails, aiActions, getSnippets,
  type AIAction, type AIActionType, type AIActionStatus, type AIPriority,
  type RegulationDetail, type Snippet, type DescriptionSegment, type DiffLine,
} from '../../data/regulations';

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const TYPE_META: Record<AIActionType, { label: string; icon: string; color: string }> = {
  snippet_identified: { label: 'Snippet identified', icon: '🔍', color: 'bg-blue-100 text-blue-800' },
  mapping_suggested:  { label: 'Mapping suggested',  icon: '🔗', color: 'bg-indigo-100 text-indigo-800' },
  gap_detected:       { label: 'Gap detected',       icon: '⚠', color: 'bg-red-100 text-red-800' },
  change_impact:      { label: 'Change impact',      icon: '📜', color: 'bg-amber-100 text-amber-800' },
  action_recommended: { label: 'Action recommended',  icon: '💡', color: 'bg-emerald-100 text-emerald-800' },
  risk_flagged:       { label: 'Risk flagged',        icon: '🚩', color: 'bg-rose-100 text-rose-800' },
};

const PRIORITY_META: Record<AIPriority, { dot: string; label: string; order: number }> = {
  critical: { dot: 'bg-red-500', label: 'Critical', order: 0 },
  high:     { dot: 'bg-orange-500', label: 'High', order: 1 },
  medium:   { dot: 'bg-blue-500', label: 'Medium', order: 2 },
  low:      { dot: 'bg-gray-400', label: 'Low', order: 3 },
};

const STATUS_STYLE: Record<AIActionStatus, string> = {
  pending:       'bg-yellow-100 text-yellow-800',
  approved:      'bg-green-100 text-green-800',
  rejected:      'bg-red-100 text-red-800',
  auto_approved: 'bg-sky-100 text-sky-800',
};

const OBJ_COLORS: Record<string, string> = {
  risk: 'text-orange-700', control: 'text-blue-700', policy: 'text-purple-700',
};
const OBJ_ICONS: Record<string, string> = { risk: '⚠', control: '🛡', policy: '📋' };

type DetailTab = 'overview' | 'ai_actions' | 'versions';

// ---------------------------------------------------------------------------
// Confidence bar
// ---------------------------------------------------------------------------

function ConfidenceBar({ value, small }: { value: number; small?: boolean }) {
  const color = value >= 90 ? 'bg-emerald-500' : value >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={`flex items-center gap-1.5 ${small ? '' : 'w-24'}`}>
      <div className={`flex-1 ${small ? 'h-1' : 'h-1.5'} bg-gray-200 rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`${small ? 'text-[10px]' : 'text-xs'} text-gray-500 tabular-nums`}>{value}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approval status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: AIActionStatus }) {
  const label = status === 'auto_approved' ? 'Auto' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[status]}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Overview tab — AI-annotated document
// ---------------------------------------------------------------------------

function OverviewTab({ detail }: { detail: RegulationDetail }) {
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const snippets = getSnippets(detail.description);
  const activeSnippet = snippets.find(s => s.id === selectedSnippet) ?? null;

  return (
    <div className="flex gap-6">
      {/* Document */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">AI-analyzed document</span>
          <span className="text-xs text-gray-400">{snippets.length} snippets identified</span>
        </div>
        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
          {detail.description.map((seg, i) => {
            if (seg.type === 'text') {
              return <span key={i} className="whitespace-pre-wrap">{seg.content}</span>;
            }
            const s = seg.snippet;
            const hasPending = s.gaps.some(g => g.approved === 'pending') || s.mappedObjects.some(o => o.approved === 'pending');
            const hasGap = s.gaps.length > 0;
            const isActive = selectedSnippet === s.id;

            let bgClass = 'bg-emerald-100/60 hover:bg-emerald-200/80 border-emerald-300';
            if (s.isChanged) bgClass = 'bg-amber-100/80 hover:bg-amber-200 border-amber-400';
            else if (hasGap) bgClass = 'bg-red-100/60 hover:bg-red-200/80 border-red-300';
            else if (hasPending) bgClass = 'bg-yellow-100/60 hover:bg-yellow-200/80 border-yellow-300';
            if (isActive) bgClass += ' ring-2 ring-red-500';

            return (
              <button
                key={i}
                onClick={() => setSelectedSnippet(isActive ? null : s.id)}
                className={`relative inline border-b-2 rounded-sm px-0.5 cursor-pointer transition-all ${bgClass}`}
              >
                {s.content}
                {hasPending && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[9px] font-bold text-white">!</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-[11px] text-gray-500 border-t border-gray-100 pt-4">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-emerald-300" />AI-identified & mapped</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-yellow-300" />Pending approval</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-red-300" />Gap detected</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-amber-400" />Changed in latest version</span>
        </div>
      </div>

      {/* Snippet detail panel */}
      {activeSnippet && (
        <div className="w-80 shrink-0 rounded-xl border border-gray-200 bg-white p-4 self-start sticky top-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Snippet details</h4>
            <button onClick={() => setSelectedSnippet(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-3 leading-relaxed">&ldquo;{activeSnippet.content}&rdquo;</p>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-gray-500">AI confidence</span>
            <ConfidenceBar value={activeSnippet.aiConfidence} />
            <StatusBadge status={activeSnippet.approvalStatus} />
          </div>

          {activeSnippet.isChanged && activeSnippet.previousContent && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 mb-3">
              <p className="text-[10px] font-semibold text-amber-700 mb-1">CHANGED FROM PREVIOUS VERSION</p>
              <p className="text-xs text-amber-900 line-through">&ldquo;{activeSnippet.previousContent}&rdquo;</p>
            </div>
          )}

          {/* Mapped objects */}
          {activeSnippet.mappedObjects.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">AI-mapped objects</p>
              <div className="space-y-1.5">
                {activeSnippet.mappedObjects.map((obj, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
                    <span className={`text-sm ${OBJ_COLORS[obj.type]}`}>{OBJ_ICONS[obj.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{obj.name}</p>
                      <ConfidenceBar value={obj.confidence} small />
                    </div>
                    <StatusBadge status={obj.approved} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {activeSnippet.gaps.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-1.5">AI-detected gaps</p>
              <div className="space-y-1.5">
                {activeSnippet.gaps.map((gap, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-2 py-1.5">
                    <span className="text-sm">⚠</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-red-900">{gap.title}</p>
                      <ConfidenceBar value={gap.confidence} small />
                    </div>
                    <StatusBadge status={gap.approved} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Actions tab — regulation-scoped action feed with approve/reject
// ---------------------------------------------------------------------------

function AIActionsTab({ regulationId, actions, onApprove, onReject }: {
  regulationId: string;
  actions: AIAction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const regActions = useMemo(
    () => actions
      .filter(a => a.regulationId === regulationId)
      .sort((a, b) => PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order),
    [actions, regulationId],
  );

  const pendingCount = regActions.filter(a => a.status === 'pending').length;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{regActions.length} AI actions</h3>
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-semibold">{pendingCount} pending</span>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => regActions.filter(a => a.status === 'pending').forEach(a => onApprove(a.id))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-sm font-medium transition-colors"
          >
            Approve all pending ({pendingCount})
          </button>
        )}
      </div>

      {regActions.map(action => {
        const tm = TYPE_META[action.type];
        const pm = PRIORITY_META[action.priority];
        const isPending = action.status === 'pending';
        const isExpanded = expanded === action.id;

        return (
          <div key={action.id} className={`rounded-xl border p-4 transition-all ${isPending ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/50'}`}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${pm.dot}`} title={pm.label} />
                <span className="text-lg">{tm.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tm.color}`}>{tm.label}</span>
                  <StatusBadge status={action.status} />
                  <span className="text-[11px] text-gray-400">{action.confidence}% confidence</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{action.title}</h4>
                <p className="text-xs text-gray-500">{action.description}</p>

                {isExpanded && (
                  <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Reasoning</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{action.reasoning}</p>
                    {action.relatedObjects && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400">Related:</span>
                        {action.relatedObjects.map(obj => (
                          <span key={obj} className="inline-flex items-center rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700">{obj}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setExpanded(isExpanded ? null : action.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPending && (
                  <>
                    <button onClick={() => onApprove(action.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Approve
                    </button>
                    <button onClick={() => onReject(action.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-700 hover:text-red-700 px-3 py-1.5 text-xs font-semibold transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Versions tab — AI-analyzed diffs
// ---------------------------------------------------------------------------

function VersionsTab({ detail }: { detail: RegulationDetail }) {
  const [selectedVersion, setSelectedVersion] = useState(detail.versions[0]?.id ?? '');
  const version = detail.versions.find(v => v.id === selectedVersion);

  return (
    <div className="flex gap-6">
      {/* Timeline */}
      <div className="w-56 shrink-0 space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Version history</h4>
        {detail.versions.map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVersion(v.id)}
            className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
              selectedVersion === v.id ? 'border-red-300 bg-red-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${selectedVersion === v.id ? 'text-red-700' : 'text-gray-900'}`}>v{v.versionNumber}</span>
              <span className="text-[11px] text-gray-400">{v.date}</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{v.summary}</p>
          </button>
        ))}
      </div>

      {/* Diff content */}
      <div className="flex-1 min-w-0">
        {version ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-gray-900">v{version.versionNumber}</span>
              <span className="text-xs text-gray-400">by {version.author} on {version.date}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12" /></svg>
                AI analyzed
              </span>
            </div>
            {version.diffFromPrevious ? (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {version.diffFromPrevious.map((line, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2 text-sm font-mono border-b border-gray-100 last:border-b-0 ${
                      line.type === 'added' ? 'bg-green-50 text-green-900' :
                      line.type === 'removed' ? 'bg-red-50 text-red-900 line-through' :
                      'bg-white text-gray-700'
                    }`}
                  >
                    <span className="mr-2 text-gray-400 select-none">{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</span>
                    {line.content || '\u00A0'}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-400">Initial version — no diff available.</div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-400">Select a version to view changes.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RegulationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const regulation = regulations.find(r => r.id === id);
  const detail = regulationDetails[id] ?? null;

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [actions, setActions] = useState<AIAction[]>(aiActions);

  const handleApprove = useCallback((actionId: string) => {
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'approved' as const } : a));
  }, []);

  const handleReject = useCallback((actionId: string) => {
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' as const } : a));
  }, []);

  const regActions = useMemo(() => actions.filter(a => a.regulationId === id), [actions, id]);
  const pendingCount = regActions.filter(a => a.status === 'pending').length;

  if (!regulation) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Regulation not found.</p>
            <button onClick={() => router.push('/')} className="text-red-700 hover:underline text-sm font-medium">Back to dashboard</button>
          </div>
        </div>
      </AppShell>
    );
  }

  const tabs: { key: DetailTab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'AI Overview' },
    { key: 'ai_actions', label: 'AI Actions', badge: pendingCount || undefined },
    { key: 'versions', label: 'Versions' },
  ];

  return (
    <AppShell>
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <button onClick={() => router.push('/')} className="hover:text-gray-900">AI Dashboard</button>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 font-medium truncate max-w-md">{regulation.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">{regulation.name}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{regulation.subRequirements} sub-requirements</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{regulation.coverage}% coverage</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className={`font-semibold ${regulation.aiStatus === 'fully_analyzed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {regulation.aiStatus === 'fully_analyzed' ? 'AI fully analyzed' :
                 regulation.aiStatus === 'analyzing' ? 'AI analyzing...' : 'Pending AI analysis'}
              </span>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">{pendingCount} pending approval{pendingCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center rounded-full bg-yellow-500 text-white text-[10px] font-bold w-5 h-5">{tab.badge}</span>
              )}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700 rounded-t" />}
            </button>
          ))}
        </div>

        {/* Content */}
        {detail ? (
          <>
            {activeTab === 'overview' && <OverviewTab detail={detail} />}
            {activeTab === 'ai_actions' && <AIActionsTab regulationId={id} actions={actions} onApprove={handleApprove} onReject={handleReject} />}
            {activeTab === 'versions' && <VersionsTab detail={detail} />}
          </>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <span className="text-4xl mb-4 block">🤖</span>
            <p className="text-sm text-gray-500">
              {regulation.aiStatus === 'analyzing'
                ? 'AI is currently analyzing this regulation. Actions will appear here once analysis is complete.'
                : 'This regulation is queued for AI analysis. Check back soon.'
              }
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
