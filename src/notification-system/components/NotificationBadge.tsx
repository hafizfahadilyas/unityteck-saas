import React from 'react';

interface NotificationBadgeProps {
  count: number;
  variant?: 'danger' | 'warning' | 'info' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  variant = 'danger',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  const colorStyles = {
    danger: 'bg-rose-500 text-white shadow-rose-500/20',
    warning: 'bg-amber-500 text-white shadow-amber-500/20',
    info: 'bg-blue-500 text-white shadow-blue-500/20',
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/20',
  }[variant];

  const sizeStyles = {
    sm: 'min-w-[18px] h-[18px] text-[10px] px-1',
    md: 'min-w-[22px] h-[22px] text-xs px-1.5',
    lg: 'min-w-[26px] h-[26px] text-sm px-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center font-black rounded-full shadow-xs leading-none select-none relative ${colorStyles} ${sizeStyles} ${className}`}
    >
      {pulse && (
        <span className="absolute -inset-0.5 rounded-full bg-rose-400 opacity-75 animate-ping pointer-events-none" />
      )}
      <span className="relative z-10">{displayCount}</span>
    </span>
  );
};
