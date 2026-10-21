import { Check, X } from 'lucide-react';

const LABELS = { done: 'Done', active: 'Next', failed: 'Failed', pending: 'Waiting' };

export default function PipelineStepper({ stages, statuses, selectedId, onSelect, label = 'Pipeline stages' }) {
  return (
    <ol className="pipeline" aria-label={label}>
      {stages.map((s) => {
        const st = statuses[s.id] || 'pending';
        const Icon = s.icon;
        const selected = s.id === selectedId;
        return (
          <li key={s.id} className={`pipeline__step is-${st} ${selected ? 'is-selected' : ''}`}>
            <button type="button" onClick={() => onSelect?.(s.id)} aria-current={selected ? 'step' : undefined}>
              <span className="pipeline__icon" aria-hidden="true">
                {st === 'done' ? <Check size={18} /> : st === 'failed' ? <X size={18} /> : <Icon size={18} />}
              </span>
              <span className="pipeline__label">{s.label}</span>
              <span className="pipeline__state">{LABELS[st]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
