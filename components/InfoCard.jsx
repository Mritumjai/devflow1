import { CircleCheck, TriangleAlert, CircleX, Info } from 'lucide-react';

export default function InfoCard({ icon: Icon, title, tone = 'default', children, actions, className = '', as: Tag = 'section' }) {
  return (
    <Tag className={`card card--${tone} ${className}`.trim()}>
      {(title || actions) && (
        <div className="card__head">
          {Icon && <Icon size={18} aria-hidden="true" className="card__icon" />}
          {title && <h3 className="card__title">{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </Tag>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

const CALLOUT_ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleX };

export function Callout({ tone = 'info', title, children }) {
  const Icon = CALLOUT_ICONS[tone] || Info;
  return (
    <div className={`callout callout--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon size={18} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        <div className="callout__text">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, children, action }) {
  return (
    <div className="empty-state">
      <Icon size={24} aria-hidden="true" />
      <h4>{title}</h4>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
