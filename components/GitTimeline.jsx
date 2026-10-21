import { timeAgo, nameIndex } from '../utils/format';

export default function GitTimeline({ items, selectedId, onSelect, emptyText = 'No commits yet.' }) {
  if (!items.length) return <p className="muted">{emptyText}</p>;
  return (
    <ol className="timeline">
      {items.map((it) => {
        const selected = it.id === selectedId;
        const inner = (
          <>
            <span className={`timeline__dot timeline__dot--${nameIndex(it.author)}`} aria-hidden="true" />
            <span className="timeline__main">
              <span className="timeline__message">{it.message}</span>
              <span className="timeline__meta">
                <span>{it.author}</span>
                <span className="mono">{it.id}</span>
                <span>{it.timeLabel || timeAgo(it.time)}</span>
              </span>
            </span>
          </>
        );
        return (
          <li key={it.id} className={`timeline__item ${selected ? 'is-selected' : ''}`}>
            {onSelect ? (
              <button type="button" className="timeline__btn" onClick={() => onSelect(it.id)} aria-pressed={selected}>
                {inner}
              </button>
            ) : (
              <div className="timeline__btn">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
