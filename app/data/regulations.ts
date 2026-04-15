export type ObjectType = 'risk' | 'control' | 'policy';
export type ObjectStatus = 'active' | 'under_review' | 'deprecated';

// ---------------------------------------------------------------------------
// AI-native: every action flows through an approval pipeline
// ---------------------------------------------------------------------------

export type AIActionType =
  | 'snippet_identified'
  | 'mapping_suggested'
  | 'gap_detected'
  | 'change_impact'
  | 'action_recommended'
  | 'risk_flagged';

export type AIActionStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

export type AIPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AIAction {
  id: string;
  type: AIActionType;
  regulationId: string;
  regulationName: string;
  title: string;
  description: string;
  confidence: number;
  status: AIActionStatus;
  createdAt: string;
  reasoning: string;
  priority: AIPriority;
  snippetContent?: string;
  suggestedObjectName?: string;
  suggestedObjectType?: ObjectType;
  relatedObjects?: string[];
}

// ---------------------------------------------------------------------------
// Regulation (simplified for AI-native — AI handles classification)
// ---------------------------------------------------------------------------

export interface Regulation {
  id: string;
  name: string;
  subRequirements: number;
  coverage: number;
  aiStatus: 'fully_analyzed' | 'analyzing' | 'pending_analysis';
  pendingActions: number;
  approvedActions: number;
  totalActions: number;
}

// ---------------------------------------------------------------------------
// Detail types (kept for document view)
// ---------------------------------------------------------------------------

export interface Snippet {
  id: string;
  content: string;
  previousContent?: string;
  isChanged: boolean;
  aiConfidence: number;
  approvalStatus: AIActionStatus;
  mappedObjects: { name: string; type: ObjectType; confidence: number; approved: AIActionStatus }[];
  gaps: { title: string; confidence: number; approved: AIActionStatus }[];
}

export type DescriptionSegment =
  | { type: 'text'; content: string }
  | { type: 'snippet'; snippet: Snippet };

export type DiffLineType = 'unchanged' | 'added' | 'removed';
export interface DiffLine { type: DiffLineType; content: string }

export interface RegulationVersion {
  id: string;
  versionNumber: string;
  date: string;
  author: string;
  summary: string;
  plainText: string;
  diffFromPrevious?: DiffLine[];
}

export interface RegulationDetail {
  description: DescriptionSegment[];
  versions: RegulationVersion[];
}

export function getSnippets(description: DescriptionSegment[]): Snippet[] {
  return description
    .filter((seg): seg is { type: 'snippet'; snippet: Snippet } => seg.type === 'snippet')
    .map(seg => seg.snippet);
}

// ---------------------------------------------------------------------------
// AI Actions — the central data store
// ---------------------------------------------------------------------------

export const aiActions: AIAction[] = [
  // --- CFPB Reg G actions ---
  {
    id: 'ai-1', type: 'snippet_identified', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Identified registration requirement snippet',
    description: 'Detected key obligation: mortgage loan originators must register with NMLS and obtain a unique identifier before engaging in origination activities.',
    confidence: 96, status: 'auto_approved', createdAt: '2026-02-01T08:12:00Z',
    reasoning: 'High-confidence match against federal registration obligation patterns. The phrase "must register" combined with "obtain a unique identifier" strongly indicates a mandatory compliance requirement.',
    priority: 'medium',
    snippetContent: 'register with the Nationwide Mortgage Licensing System and Registry (NMLS) and obtain a unique identifier',
  },
  {
    id: 'ai-2', type: 'mapping_suggested', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Map "MLO Registration Compliance Program" to registration snippet',
    description: 'AI recommends connecting the existing MLO Registration Compliance Program control to the NMLS registration requirement in Section 1503.',
    confidence: 94, status: 'approved', createdAt: '2026-02-01T08:13:00Z',
    reasoning: 'The control\'s scope directly addresses federal registration obligations. Name match confidence: 94%. Coverage analysis shows this control handles NMLS registration workflows.',
    priority: 'medium',
    suggestedObjectName: 'MLO Registration Compliance Program', suggestedObjectType: 'control',
    snippetContent: 'register with the Nationwide Mortgage Licensing System and Registry (NMLS) and obtain a unique identifier',
  },
  {
    id: 'ai-3', type: 'mapping_suggested', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Map "Unlicensed Originator Activity" risk to registration snippet',
    description: 'AI identifies that unlicensed originator activity is the primary risk addressed by the registration requirement.',
    confidence: 91, status: 'approved', createdAt: '2026-02-01T08:13:30Z',
    reasoning: 'Risk-regulation alignment analysis: the registration mandate exists to prevent unlicensed origination. Causal relationship confidence: 91%.',
    priority: 'medium',
    suggestedObjectName: 'Unlicensed Originator Activity', suggestedObjectType: 'risk',
  },
  {
    id: 'ai-4', type: 'gap_detected', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'No control for continuing education tracking',
    description: 'Section 1505 requires annual 8-hour NMLS-approved continuing education. No existing control monitors completion or tracks hours. This creates a compliance gap.',
    confidence: 98, status: 'pending', createdAt: '2026-02-03T10:05:00Z',
    reasoning: 'Scanned all mapped controls against Section 1505 obligations. Zero controls address CE tracking, hour logging, or course approval verification. Gap confidence: 98%.',
    priority: 'critical',
    snippetContent: 'complete at least 8 hours of NMLS-approved continuing education annually',
  },
  {
    id: 'ai-5', type: 'change_impact', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Reporting frequency changed: annual → quarterly',
    description: 'Version 3.0 changed Section 1506 from annual to quarterly reporting. The "Regulatory Reporting Process" control must be updated. Cascading impact on "Automated Report Generation" secondary relation.',
    confidence: 99, status: 'pending', createdAt: '2026-02-03T14:22:00Z',
    reasoning: 'Diff analysis detected text change "submit annual reports" → "submit quarterly reports". Mapped control "Regulatory Reporting Process" was designed for annual cadence. Downstream automation triggers also need revision.',
    priority: 'critical',
    relatedObjects: ['Regulatory Reporting Process', 'Automated Report Generation'],
  },
  {
    id: 'ai-6', type: 'action_recommended', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Create deadline-tracking control for 30-day submission window',
    description: 'The updated Section 1506 introduces a 30-day submission deadline after each quarter. Recommend creating a new automated deadline-tracking control with escalation alerts.',
    confidence: 92, status: 'pending', createdAt: '2026-02-03T14:25:00Z',
    reasoning: 'New regulatory text "within 30 days following the end of each reporting period" has no mapped control. Proactive creation of a tracking control prevents future non-compliance.',
    priority: 'high',
    relatedObjects: ['Reporting Compliance Risk'],
  },
  {
    id: 'ai-7', type: 'snippet_identified', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Identified background check requirement snippet',
    description: 'Detected obligation: applicants must authorize NMLS to obtain criminal history, credit history, and regulatory findings.',
    confidence: 95, status: 'auto_approved', createdAt: '2026-02-01T08:14:00Z',
    reasoning: 'Obligation pattern match: "must authorize" + enumerated personal data categories indicates a mandatory screening requirement.',
    priority: 'medium',
    snippetContent: 'authorize the NMLS to obtain information related to criminal history, credit history, and any administrative, civil, or criminal findings',
  },
  {
    id: 'ai-8', type: 'risk_flagged', regulationId: '1',
    regulationName: 'CFPB Reg G – SAFE Act Federal Registration',
    title: 'Identity Verification Protocol under review — secondary risk',
    description: 'The secondary relation "Identity Verification Protocol" linked to "Background Check & Screening Process" is currently under review. This may affect coverage of Section 1504.',
    confidence: 87, status: 'pending', createdAt: '2026-02-04T09:10:00Z',
    reasoning: 'Object status monitoring detected "Identity Verification Protocol" changed to under_review. As a secondary relation supporting background check coverage, this creates potential coverage degradation.',
    priority: 'high',
    relatedObjects: ['Identity Verification Protocol', 'Background Check & Screening Process'],
  },

  // --- GDPR actions ---
  {
    id: 'ai-9', type: 'change_impact', regulationId: '12',
    regulationName: 'General Data Protection Regulation (GDPR)',
    title: 'EU amendments to Articles 17 and 22 detected',
    description: 'EU published amendments effective Mar 2026 updating data erasure (Art. 17) and automated decision-making (Art. 22) provisions. 12 mapped controls require review.',
    confidence: 97, status: 'pending', createdAt: '2026-02-02T11:00:00Z',
    reasoning: 'Regulatory feed detected official EU amendment publication. Cross-referenced against 34 mapped controls — 12 have direct dependency on Articles 17 or 22 provisions.',
    priority: 'critical',
    relatedObjects: ['Data Erasure Workflow', 'Automated Decision Engine', 'DSAR Response Process'],
  },
  {
    id: 'ai-10', type: 'action_recommended', regulationId: '12',
    regulationName: 'General Data Protection Regulation (GDPR)',
    title: 'Update DSAR Response Process for new erasure timeline',
    description: 'Article 17 amendment shortens erasure response window from 30 to 15 days. The DSAR Response Process control must be updated to meet the new deadline.',
    confidence: 95, status: 'pending', createdAt: '2026-02-02T11:05:00Z',
    reasoning: 'Diff analysis: "within one month" changed to "within 15 calendar days". Current DSAR control SLA is set to 30 days. Non-compliance risk if not updated before Mar 2026.',
    priority: 'critical',
    suggestedObjectName: 'DSAR Response Process', suggestedObjectType: 'control',
  },
  {
    id: 'ai-11', type: 'gap_detected', regulationId: '12',
    regulationName: 'General Data Protection Regulation (GDPR)',
    title: 'No control for algorithmic transparency requirement',
    description: 'Updated Article 22 now requires organizations to provide meaningful explanations of algorithmic logic. No existing control addresses this.',
    confidence: 93, status: 'pending', createdAt: '2026-02-02T11:08:00Z',
    reasoning: 'New provision in Art. 22(3a): "provide a meaningful explanation of the logic involved". Scanned all 34 mapped controls — none address algorithmic transparency or explainability.',
    priority: 'high',
  },

  // --- PCI DSS actions ---
  {
    id: 'ai-12', type: 'risk_flagged', regulationId: '14',
    regulationName: 'PCI DSS v4.0',
    title: 'Network Segmentation Validation control deprecated',
    description: 'Connected control "Network Segmentation Validation" has been deprecated. 3 sub-requirements in Requirement 11 are now uncovered.',
    confidence: 100, status: 'pending', createdAt: '2026-02-01T16:30:00Z',
    reasoning: 'Control lifecycle monitoring: "Network Segmentation Validation" status changed to deprecated on 2026-01-30. Cross-reference shows 3 sub-requirements (11.3.4, 11.3.4.1, 11.4.6) relied on this control.',
    priority: 'critical',
    relatedObjects: ['Network Segmentation Validation'],
  },
  {
    id: 'ai-13', type: 'action_recommended', regulationId: '14',
    regulationName: 'PCI DSS v4.0',
    title: 'Assign replacement control for network segmentation testing',
    description: 'Recommend mapping "Penetration Testing Program" as a replacement control for the deprecated Network Segmentation Validation. Coverage analysis shows 85% overlap.',
    confidence: 85, status: 'pending', createdAt: '2026-02-01T16:35:00Z',
    reasoning: 'Analyzed all active controls for coverage overlap with deprecated control. "Penetration Testing Program" has highest alignment at 85%. Remaining 15% gap in automated validation may need a new control.',
    priority: 'high',
    suggestedObjectName: 'Penetration Testing Program', suggestedObjectType: 'control',
  },

  // --- HIPAA actions ---
  {
    id: 'ai-14', type: 'risk_flagged', regulationId: '15',
    regulationName: 'HIPAA',
    title: 'PHI Access Logging Policy expired — renewal overdue',
    description: 'The "PHI Access Logging Policy" connected to HIPAA Section 164.312 has expired. Annual renewal was due 2026-01-15. This creates an active compliance risk.',
    confidence: 100, status: 'pending', createdAt: '2026-02-03T08:00:00Z',
    reasoning: 'Policy lifecycle monitoring: expiration date 2026-01-15 passed. No renewal request submitted. Policy governs PHI access audit logging — critical for HIPAA compliance.',
    priority: 'critical',
    relatedObjects: ['PHI Access Logging Policy'],
  },
  {
    id: 'ai-15', type: 'action_recommended', regulationId: '15',
    regulationName: 'HIPAA',
    title: 'Initiate emergency policy renewal for PHI Access Logging',
    description: 'Recommend immediate renewal of the PHI Access Logging Policy. Draft updated policy incorporating latest HHS guidance on audit log retention periods.',
    confidence: 96, status: 'pending', createdAt: '2026-02-03T08:02:00Z',
    reasoning: 'Expired policy + regulatory requirement = critical gap. Auto-generated renewal draft based on previous policy version + HHS 2026 guidance update. Needs human review and approval.',
    priority: 'critical',
    suggestedObjectName: 'PHI Access Logging Policy', suggestedObjectType: 'policy',
  },

  // --- SOX actions ---
  {
    id: 'ai-16', type: 'mapping_suggested', regulationId: '13',
    regulationName: 'SOX Section 404',
    title: 'Map "Internal Controls Testing Framework" to assessment requirement',
    description: 'AI identified that the Internal Controls Testing Framework should be mapped to SOX Section 404(a) management assessment requirements.',
    confidence: 90, status: 'pending', createdAt: '2026-02-04T07:30:00Z',
    reasoning: 'Section 404(a) requires annual assessment of internal controls. "Internal Controls Testing Framework" directly addresses this through quarterly testing cycles. Confidence: 90%.',
    priority: 'medium',
    suggestedObjectName: 'Internal Controls Testing Framework', suggestedObjectType: 'control',
  },
  {
    id: 'ai-17', type: 'risk_flagged', regulationId: '13',
    regulationName: 'SOX Section 404',
    title: 'Secondary control "Audit Trail Integrity Check" deprecated',
    description: 'The secondary relation "Audit Trail Integrity Check" has been deprecated. A replacement control is pending approval. SOX Section 302 certification coverage may be affected.',
    confidence: 95, status: 'pending', createdAt: '2026-02-04T09:00:00Z',
    reasoning: 'Control deprecation detected via lifecycle monitoring. "Audit Trail Integrity Check" supports CEO/CFO certification requirements under Section 302. Replacement "Enhanced Audit Trail v2" is in approval pipeline.',
    priority: 'high',
    relatedObjects: ['Audit Trail Integrity Check', 'Enhanced Audit Trail v2'],
  },

  // --- CCPA actions ---
  {
    id: 'ai-18', type: 'risk_flagged', regulationId: '11',
    regulationName: 'CCPA',
    title: 'Consumer Data Breach Risk severity escalated to critical',
    description: 'Following a recent security incident, the "Consumer Data Breach Risk" connected to CCPA Section 1798.150 has been re-assessed from high to critical severity.',
    confidence: 100, status: 'pending', createdAt: '2026-02-03T15:00:00Z',
    reasoning: 'Risk assessment engine: incident report filed 2026-02-02 triggered automatic re-evaluation. Breach notification obligations under CCPA 1798.150 are directly implicated. Severity: critical.',
    priority: 'critical',
    relatedObjects: ['Consumer Data Breach Risk', 'Breach Notification Workflow'],
  },
  {
    id: 'ai-19', type: 'action_recommended', regulationId: '11',
    regulationName: 'CCPA',
    title: 'Review breach notification timeline compliance',
    description: 'Given the escalated risk, AI recommends an immediate review of the Breach Notification Workflow to ensure the 72-hour notification requirement is achievable.',
    confidence: 93, status: 'pending', createdAt: '2026-02-03T15:05:00Z',
    reasoning: 'CCPA 1798.150 + escalated breach risk = elevated non-compliance probability. Current workflow SLA is 96 hours — exceeds the 72-hour statutory requirement. Urgent adjustment needed.',
    priority: 'critical',
    suggestedObjectName: 'Breach Notification Workflow', suggestedObjectType: 'control',
  },
];

// ---------------------------------------------------------------------------
// Regulations listing
// ---------------------------------------------------------------------------

export const regulations: Regulation[] = [
  { id: '1', name: 'CFPB Reg G – SAFE Act Federal Registration', subRequirements: 128, coverage: 60, aiStatus: 'fully_analyzed', pendingActions: 4, approvedActions: 3, totalActions: 8 },
  { id: '2', name: 'CFPB Reg H – SAFE Act State Compliance', subRequirements: 128, coverage: 0, aiStatus: 'analyzing', pendingActions: 0, approvedActions: 0, totalActions: 0 },
  { id: '3', name: '47 U.S. Code – Title 47 Telegraphs, Telephones', subRequirements: 128, coverage: 0, aiStatus: 'pending_analysis', pendingActions: 0, approvedActions: 0, totalActions: 0 },
  { id: '4', name: 'Administrative Rules of Montana', subRequirements: 128, coverage: 0, aiStatus: 'pending_analysis', pendingActions: 0, approvedActions: 0, totalActions: 0 },
  { id: '11', name: 'California Consumer Privacy Act (CCPA)', subRequirements: 96, coverage: 45, aiStatus: 'fully_analyzed', pendingActions: 2, approvedActions: 8, totalActions: 12 },
  { id: '12', name: 'General Data Protection Regulation (GDPR)', subRequirements: 204, coverage: 78, aiStatus: 'fully_analyzed', pendingActions: 3, approvedActions: 28, totalActions: 34 },
  { id: '13', name: 'Sarbanes-Oxley Act (SOX) Section 404', subRequirements: 156, coverage: 92, aiStatus: 'fully_analyzed', pendingActions: 2, approvedActions: 24, totalActions: 28 },
  { id: '14', name: 'PCI DSS v4.0', subRequirements: 312, coverage: 65, aiStatus: 'fully_analyzed', pendingActions: 2, approvedActions: 38, totalActions: 45 },
  { id: '15', name: 'Health Insurance Portability (HIPAA)', subRequirements: 180, coverage: 88, aiStatus: 'fully_analyzed', pendingActions: 2, approvedActions: 18, totalActions: 22 },
  { id: '16', name: 'ISO 27001:2022 Information Security', subRequirements: 144, coverage: 55, aiStatus: 'fully_analyzed', pendingActions: 0, approvedActions: 19, totalActions: 19 },
  { id: '17', name: 'NIST Cybersecurity Framework (CSF) 2.0', subRequirements: 108, coverage: 72, aiStatus: 'fully_analyzed', pendingActions: 0, approvedActions: 16, totalActions: 16 },
  { id: '18', name: 'FFIEC IT Handbook', subRequirements: 256, coverage: 0, aiStatus: 'analyzing', pendingActions: 0, approvedActions: 0, totalActions: 0 },
  { id: '28', name: 'Dodd-Frank Wall Street Reform Act – Title X', subRequirements: 220, coverage: 35, aiStatus: 'fully_analyzed', pendingActions: 1, approvedActions: 12, totalActions: 15 },
];

// ---------------------------------------------------------------------------
// Detail data — CFPB Reg G (id: '1')
// ---------------------------------------------------------------------------

const regGDescription: DescriptionSegment[] = [
  { type: 'text', content: 'The Secure and Fair Enforcement for Mortgage Licensing Act (SAFE Act) establishes federal requirements for the registration and licensing of residential mortgage loan originators (MLOs). The purpose of the Act is to enhance consumer protection, reduce fraud, and provide a comprehensive licensing framework across all states.\n\nSection 1503 — Federal Registration Requirement\n\n' },
  { type: 'text', content: 'All individuals who engage in the business of residential mortgage loan origination must ' },
  {
    type: 'snippet',
    snippet: {
      id: 'snip-1',
      content: 'register with the Nationwide Mortgage Licensing System and Registry (NMLS) and obtain a unique identifier',
      isChanged: false, aiConfidence: 96, approvalStatus: 'auto_approved',
      mappedObjects: [
        { name: 'MLO Registration Compliance Program', type: 'control', confidence: 94, approved: 'approved' },
        { name: 'Unlicensed Originator Activity', type: 'risk', confidence: 91, approved: 'approved' },
      ],
      gaps: [],
    },
  },
  { type: 'text', content: ' before engaging in mortgage loan origination activities. This registration must be completed prior to any interaction with consumers in connection with a residential mortgage loan. Employers of mortgage loan originators are responsible for ensuring compliance.\n\nSection 1504 — Background Checks\n\n' },
  { type: 'text', content: 'Each individual applying for registration must ' },
  {
    type: 'snippet',
    snippet: {
      id: 'snip-2',
      content: 'authorize the NMLS to obtain information related to criminal history, credit history, and any administrative, civil, or criminal findings',
      isChanged: false, aiConfidence: 95, approvalStatus: 'auto_approved',
      mappedObjects: [
        { name: 'Background Check & Screening Process', type: 'control', confidence: 93, approved: 'approved' },
        { name: 'Employee Screening & Onboarding Policy', type: 'policy', confidence: 89, approved: 'approved' },
      ],
      gaps: [],
    },
  },
  { type: 'text', content: ' by any federal or state regulatory authority. The background check must be renewed at intervals determined by the Registry, and any material change in the applicant\'s record must be reported within 30 days.\n\nSection 1505 — Continuing Education\n\n' },
  { type: 'text', content: 'Registered mortgage loan originators must ' },
  {
    type: 'snippet',
    snippet: {
      id: 'snip-3',
      content: 'complete at least 8 hours of NMLS-approved continuing education annually',
      isChanged: false, aiConfidence: 97, approvalStatus: 'auto_approved',
      mappedObjects: [],
      gaps: [{ title: 'No control for CE tracking', confidence: 98, approved: 'pending' }],
    },
  },
  { type: 'text', content: ', including 3 hours of Federal law, 2 hours of ethics, and 2 hours of non-traditional lending. An MLO may not take the same approved course in the same or successive years to meet the requirements. Failure to meet continuing education requirements will result in suspension of registration.\n\nSection 1506 — Reporting Requirements\n\n' },
  { type: 'text', content: 'Registered entities must ' },
  {
    type: 'snippet',
    snippet: {
      id: 'snip-4',
      content: 'submit quarterly reports to the NMLS',
      previousContent: 'submit annual reports to the NMLS',
      isChanged: true, aiConfidence: 99, approvalStatus: 'auto_approved',
      mappedObjects: [
        { name: 'Regulatory Reporting Process', type: 'control', confidence: 88, approved: 'pending' },
      ],
      gaps: [{ title: '30-day submission deadline has no control', confidence: 92, approved: 'pending' }],
    },
  },
  { type: 'text', content: ' detailing all registered MLO activity, including origination volumes, disciplinary actions, and status changes. Reports must be submitted within 30 days following the end of each reporting period and must conform to the data standards published by the Registry.\n\nSection 1507 — Unique Identifier\n\nEach registered MLO shall be ' },
  {
    type: 'snippet',
    snippet: {
      id: 'snip-5',
      content: 'assigned a unique identifier by the NMLS, which must be displayed on all loan documents',
      isChanged: false, aiConfidence: 94, approvalStatus: 'auto_approved',
      mappedObjects: [
        { name: 'MLO Identifier Tracking System', type: 'control', confidence: 96, approved: 'approved' },
        { name: 'Document Standards Policy', type: 'policy', confidence: 90, approved: 'approved' },
      ],
      gaps: [],
    },
  },
  { type: 'text', content: ', correspondence, and public-facing materials related to mortgage lending activities. The unique identifier must remain associated with the individual throughout their career, regardless of changes in employer or state of licensure.' },
];

const regGVersions: RegulationVersion[] = [
  {
    id: 'v3', versionNumber: '3.0', date: '2026-01-20', author: 'CFPB Regulatory Office',
    summary: 'Changed reporting frequency from annual to quarterly; added 30-day submission deadline.',
    plainText: 'The Secure and Fair Enforcement for Mortgage Licensing Act (SAFE Act)...',
    diffFromPrevious: [
      { type: 'unchanged', content: '...(sections 1503-1505 unchanged)...' },
      { type: 'unchanged', content: 'Section 1506 — Reporting Requirements' },
      { type: 'removed', content: 'Registered entities must submit annual reports to the NMLS detailing all registered MLO activity, including origination volumes, disciplinary actions, and status changes.' },
      { type: 'added', content: 'Registered entities must submit quarterly reports to the NMLS detailing all registered MLO activity, including origination volumes, disciplinary actions, and status changes. Reports must be submitted within 30 days following the end of each reporting period and must conform to the data standards published by the Registry.' },
      { type: 'unchanged', content: '...(section 1507 unchanged)...' },
    ],
  },
  {
    id: 'v2', versionNumber: '2.0', date: '2025-06-15', author: 'CFPB Regulatory Office',
    summary: 'Added 30-day material change reporting; clarified employer responsibilities.',
    plainText: '...',
  },
  {
    id: 'v1', versionNumber: '1.0', date: '2024-11-01', author: 'CFPB Regulatory Office',
    summary: 'Initial publication.',
    plainText: '...',
  },
];

export const regulationDetails: Record<string, RegulationDetail> = {
  '1': { description: regGDescription, versions: regGVersions },
};
