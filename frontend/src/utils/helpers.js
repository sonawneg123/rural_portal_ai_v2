// src/utils/helpers.js

export const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
];

export const CAT_EMOJI = {
  'Water Supply':'💧','Roads & Transport':'🛣️','Electricity':'⚡',
  'Healthcare':'🏥','Education':'📚','Agriculture':'🌾',
  'Sanitation':'🗑️','Connectivity':'📶','Public Safety':'🛡️','Govt Schemes':'🏛️',
};

export const STATUS_CONFIG = {
  pending:     { label:'Pending',     color:'var(--st-pending)',  bg:'var(--st-pending-bg)' },
  in_review:   { label:'In Review',   color:'var(--st-review)',   bg:'var(--st-review-bg)' },
  in_progress: { label:'In Progress', color:'var(--st-progress)', bg:'var(--st-progress-bg)' },
  resolved:    { label:'Resolved',    color:'var(--st-resolved)', bg:'var(--st-resolved-bg)' },
  rejected:    { label:'Rejected',    color:'var(--st-rejected)', bg:'var(--st-rejected-bg)' },
};

export const PRIORITY_CONFIG = {
  low:      { label:'Low',      color:'var(--text-60)' },
  medium:   { label:'Medium',   color:'var(--warning)' },
  high:     { label:'High',     color:'var(--danger)' },
  critical: { label:'Critical', color:'var(--purple)' },
};

export const ROLE_CONFIG = {
  admin:     { label:'Admin',          color:'#fff',           bg:'#0F172A',     icon:'🔐', tier:0 },
  cm:        { label:'Chief Minister', color:'#fff',           bg:'var(--navy)', icon:'🏛️', tier:1 },
  collector: { label:'Collector',      color:'var(--purple)',  bg:'#F5F3FF',     icon:'🏢', tier:2 },
  mp:        { label:'MP',             color:'#fff',           bg:'#1D4ED8',     icon:'🇮🇳', tier:2 },
  mla:       { label:'MLA',            color:'var(--navy)',    bg:'#ECFDF5',     icon:'🏘️', tier:3 },
  sarpanch:  { label:'Sarpanch',       color:'#92400E',        bg:'#FFFBEB',     icon:'👤', tier:4 },
  gramsevak: { label:'Gram Sevak',     color:'#065F46',        bg:'#ECFDF5',     icon:'📋', tier:4 },
  user:      { label:'Citizen',        color:'var(--text-60)', bg:'var(--bg-alt)',icon:'👤',tier:5 },
};

export const formatBudget = (amount) => {
  if (!amount && amount !== 0) return '—';
  const n = Number(amount);
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n}`;
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
};

export const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
  : '';

export const formatNumber = (n) => {
  if (!n) return '0';
  if (n >= 10000000) return (n/10000000).toFixed(1)+'Cr';
  if (n >= 100000)   return (n/100000).toFixed(1)+'L';
  if (n >= 1000)     return (n/1000).toFixed(1)+'K';
  return String(n);
};

export const truncate = (str='', len=100) =>
  str.length > len ? str.slice(0,len)+'…' : str;

export const stringToColor = (str='') => {
  const colors = ['#0A2540','#635BFF','#00D4B2','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const budgetPct = (used, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
};
