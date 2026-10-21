import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, RotateCcw } from 'lucide-react';
import { Badge } from './InfoCard';

export default function TerminalSimulator({
  log,
  onRun,
  quick = [],
  readOnly = false,
  title = 'Simulated terminal',
  onReset,
  height = 320,
  emptyText = 'No commands yet. Type a command or use the buttons below.',
  prompt = 'devflow-demo (main)',
}) {
  const [value, setValue] = useState('');
  const [cursor, setCursor] = useState(-1);
  const bodyRef = useRef(null);
  const history = log.map((e) => e.cmd).filter(Boolean);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [log]);

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onRun(value);
    setValue('');
    setCursor(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === 'ArrowDown' && cursor !== -1) {
      e.preventDefault();
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setValue('');
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    }
  };

  return (
    <div className="terminal">
      <div className="terminal__bar">
        <TerminalIcon size={16} aria-hidden="true" />
        <span className="terminal__title">{title}</span>
        <Badge tone="amber">Simulation</Badge>
        {onReset && (
          <button type="button" className="btn btn--ghost btn--sm terminal__reset" onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" /> Reset demo
          </button>
        )}
      </div>
      <div
        ref={bodyRef}
        className="terminal__body"
        style={{ height }}
        role="log"
        aria-live="polite"
        aria-label={`${title} output`}
        tabIndex={0}
      >
        {log.length === 0 && <p className="terminal__empty">{emptyText}</p>}
        {log.map((entry) => (
          <div key={entry.id} className="terminal__entry">
            <div className="terminal__cmd">
              <span className="terminal__prompt">$</span> {entry.cmd}
            </div>
            {entry.output.map((l, i) => (
              <div key={i} className={`terminal__line terminal__line--${l.t}`}>
                {l.text || ' '}
              </div>
            ))}
          </div>
        ))}
      </div>
      {!readOnly && (
        <form className="terminal__form" onSubmit={submit}>
          <label htmlFor="terminal-input" className="terminal__prompt-label">
            {prompt} <span aria-hidden="true">$</span>
          </label>
          <input
            id="terminal-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder='try: git status'
          />
          <button type="submit" className="btn btn--primary btn--sm">
            Run
          </button>
        </form>
      )}
      {!readOnly && quick.length > 0 && (
        <div className="terminal__quick" role="group" aria-label="Quick commands">
          {quick.map((cmd) => (
            <button key={cmd} type="button" className="chip" onClick={() => onRun(cmd)}>
              {cmd}
            </button>
          ))}
        </div>
      )}
      <p className="terminal__note">
        Simulation only: commands run inside this page and never touch a real Git repository or your computer.
      </p>
    </div>
  );
}
