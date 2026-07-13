export const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
];

export const CAT_EMOJI = {
  'Water Supply':      '💧',
  'Roads & Transport': '🛣️',
  'Electricity':       '⚡',
  'Healthcare':        '🏥',
  'Education':         '📚',
  'Agriculture':       '🌾',
  'Sanitation':        '🗑️',
  'Connectivity':      '📶',
  'Public Safety':     '🛡️',
  'Govt Schemes':      '🏛️',
};

export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     tw: 'badge-pending' },
  in_review:   { label: 'In Review',   tw: 'badge-in_review' },
  in_progress: { label: 'In Progress', tw: 'badge-in_progress' },
  resolved:    { label: 'Resolved',    tw: 'badge-resolved' },
  rejected:    { label: 'Rejected',    tw: 'badge-rejected' },
};

export const ROLE_CONFIG = {
  admin:     { label: 'Admin',          icon: '🔐', tw: 'role-admin',     dash: '/admin' },
  cm:        { label: 'Chief Minister', icon: '🏛️', tw: 'role-cm',        dash: '/cm' },
  collector: { label: 'Collector',      icon: '🏢', tw: 'role-collector',  dash: '/collector' },
  mp:        { label: 'MP',             icon: '🇮🇳', tw: 'role-mp',        dash: '/mp' },
  mla:       { label: 'MLA',            icon: '🏘️', tw: 'role-mla',       dash: '/mla' },
  sarpanch:  { label: 'Sarpanch',       icon: '👤', tw: 'role-sarpanch',  dash: '/sarpanch' },
  gramsevak: { label: 'Gram Sevak',     icon: '📋', tw: 'role-gramsevak', dash: '/gramsevak' },
  user:      { label: 'Citizen',        icon: '👤', tw: 'role-user',      dash: null },
};

export const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: 'text-slate-500' },
  medium:   { label: 'Medium',   color: 'text-amber-600' },
  high:     { label: 'High',     color: 'text-red-500' },
  critical: { label: 'Critical', color: 'text-purple-600' },
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs   = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  const days  = Math.floor(hrs  / 24);
  if (days < 30)  return `${days}d ago`;
  return formatDate(dateStr);
};

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export const formatBudget = (amount) => {
  if (!amount && amount !== 0) return '—';
  const n = Number(amount);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

export const formatNumber = (n) => {
  if (!n) return '0';
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)     return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

export const truncate = (str = '', len = 100) =>
  str.length > len ? str.slice(0, len) + '…' : str;

export const severityColor = (score) => {
  if (!score) return 'text-slate-400';
  if (score >= 8) return 'text-red-500';
  if (score >= 5) return 'text-amber-500';
  return 'text-emerald-500';
};

export const severityBg = (score) => {
  if (!score) return 'bg-slate-100 text-slate-500';
  if (score >= 8) return 'bg-red-50 text-red-600';
  if (score >= 5) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
};

export const budgetPct = (used, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
};

export const clsx = (...args) =>
  args.flat().filter(Boolean).join(' ');
