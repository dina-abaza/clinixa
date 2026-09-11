import React from 'react';
import { Link } from 'react-router-dom';

export interface StatCardProps {
  label: string;
  value: number | string;
  iconId: string;
  tone?: 'tone-a' | 'tone-b' | 'tone-c' | 'tone-d';
  currency?: string;
  foot?: React.ReactNode;
  footTone?: 'danger' | 'warning' | 'success';
  to?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  iconId,
  tone = 'tone-a',
  currency,
  foot,
  footTone,
  to,
  onClick,
}: StatCardProps) {
  const content = (
    <>
      <div className="stat-top">
        <span className="stat-icon" aria-hidden="true">
          <svg width={20} height={20}>
            <use href={`#${iconId}`} />
          </svg>
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">
        <span className="num">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {currency ? <span className="currency">{currency}</span> : null}
      </div>
      {foot ? (
        <div className={`stat-foot ${footTone || ''}`}>
          {foot}
        </div>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`stat-card glass clickable ${tone}`}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`stat-card glass clickable ${tone}`}>
        {content}
      </button>
    );
  }

  return <div className={`stat-card glass ${tone}`}>{content}</div>;
}
