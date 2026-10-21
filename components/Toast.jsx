import { CircleCheck, TriangleAlert, CircleX, Info, X } from 'lucide-react';

const ICONS = { success: CircleCheck, warning: TriangleAlert, error: CircleX, info: Info };

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`toast toast--${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <Icon size={18} aria-hidden="true" />
            <p>{t.text}</p>
            <button type="button" className="icon-btn" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
