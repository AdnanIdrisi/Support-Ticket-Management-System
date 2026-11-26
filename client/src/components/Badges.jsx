const STATUS_STYLES = {
  open: {
    bg: 'bg-[#EEF2FF]',
    text: 'text-[#4338CA]',
    dot: 'bg-[#4F46E5]',
    label: 'Open',
  },
  in_progress: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#B45309]',
    dot: 'bg-[#F59E0B]',
    label: 'In Progress',
  },
  resolved: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#047857]',
    dot: 'bg-[#10B981]',
    label: 'Resolved',
  },
  closed: {
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#475569]',
    dot: 'bg-[#94A3B8]',
    label: 'Closed',
  },
};

const PRIORITY_STYLES = {
  urgent: {
    bg: 'bg-[#FFE4E6]',
    text: 'text-[#BE123C]',
    dot: 'bg-[#F43F5E]',
    label: 'Urgent',
  },
  high: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'High',
  },
  medium: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    label: 'Medium',
  },
  low: {
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    dot: 'bg-slate-300',
    label: 'Low',
  },
};

const CATEGORY_LABELS = {
  technical: 'Technical',
  billing: 'Billing',
  account: 'Account',
  feature_request: 'Feature',
  bug: 'Bug',
  other: 'Other',
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${p.bg} ${p.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}
