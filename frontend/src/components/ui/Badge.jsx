import clsx from 'clsx';
import { STATUS_CONFIG, ROLE_CONFIG, severityBg } from '../../utils/helpers.js';

export function StatusBadge({ status, className }) {
  const cfg = STATUS_CONFIG[status] || {};
  return (
    <span className={clsx('badge', cfg.tw, className)}>
      {cfg.label || status}
    </span>
  );
}

export function RoleBadge({ role, className }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span className={clsx('role-badge', cfg.tw, className)}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function SeverityBadge({ score, className }) {
  if (!score) return null;
  return (
    <span className={clsx('badge', severityBg(score), className)}>
      Severity {score}/10
    </span>
  );
}

export function AIBadge({ label = 'AI', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
      'bg-violet-50 text-violet-700 border border-violet-200',
      className
    )}>
      ✦ {label}
    </span>
  );
}

export function PriorityBadge({ priority, className }) {
  const map = {
    low:      'bg-slate-100 text-slate-600',
    medium:   'bg-amber-50 text-amber-700',
    high:     'bg-red-50 text-red-600',
    critical: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={clsx('badge', map[priority] || map.medium, className)}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Medium'}
    </span>
  );
}
