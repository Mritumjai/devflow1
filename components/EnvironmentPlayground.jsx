import { useState } from 'react';
import { Eye, EyeOff, Lock, Globe } from 'lucide-react';
import { ENV_VARS, GITIGNORE_FILE, GITIGNORE_SAMPLES, VITE_SAMPLES } from '../data/demoEnv';
import { classifyVariable, isIgnored } from '../utils/envTools';
import { Badge, Callout } from './InfoCard';

export default function EnvironmentPlayground() {
  const [masked, setMasked] = useState(true);
  const [selected, setSelected] = useState(ENV_VARS[0].key);
  const [varName, setVarName] = useState('VITE_API_KEY');
  const [filePath, setFilePath] = useState('.env');

  const current = ENV_VARS.find((v) => v.key === selected);
  const verdict = classifyVariable(varName);
  const ignored = isIgnored(filePath, GITIGNORE_FILE);
  const tone = { danger: 'error', public: 'warning', server: 'success', error: 'error', empty: 'info' }[verdict.state];

  return (
    <div className="playground">
      <div className="playground__panel">
        <div className="playground__head">
          <h3>Sample .env file</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMasked((m) => !m)} aria-pressed={!masked}>
            {masked ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
            {masked ? 'Show placeholder values' : 'Mask values'}
          </button>
        </div>
        <ul className="env-list" aria-label="Environment variables">
          {ENV_VARS.map((v) => (
            <li key={v.key}>
              <button type="button" className={`env-row ${selected === v.key ? 'is-selected' : ''}`} onClick={() => setSelected(v.key)} aria-pressed={selected === v.key}>
                <span className="mono env-row__key">{v.key}</span>
                <span className="mono env-row__eq">=</span>
                <span className="mono env-row__value">{masked ? '•'.repeat(Math.max(8, v.value.length)) : v.value}</span>
              </button>
            </li>
          ))}
        </ul>
        <Callout tone="warning" title="Masking is only a demonstration">
          Hiding a value on screen does not protect it. A real secret still sits in the file, in memory, and in any code that reads it. Real protection means never committing it and storing it in your host’s secret manager.
        </Callout>
        <div className="env-detail" aria-live="polite">
          <div className="env-detail__head">
            <strong className="mono">{current.key}</strong>
            <Badge tone="blue">{current.kind}</Badge>
            <Badge tone="neutral">
              <Lock size={12} aria-hidden="true" /> server only
            </Badge>
          </div>
          <p>{current.text}</p>
        </div>
      </div>

      <div className="playground__panel">
        <h3>Will Vite expose this variable?</h3>
        <label className="field" htmlFor="var-name">
          Variable name
          <input id="var-name" className="input mono" value={varName} onChange={(e) => setVarName(e.target.value)} spellCheck="false" autoComplete="off" />
        </label>
        <div className="chip-row" role="group" aria-label="Sample variable names">
          {VITE_SAMPLES.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => setVarName(s)}>
              {s}
            </button>
          ))}
        </div>
        <Callout tone={tone} title={verdict.title}>
          {verdict.text}
        </Callout>

        <h3 className="playground__sub">Will Git ignore this file?</h3>
        <label className="field" htmlFor="file-path">
          File path (checked against the .gitignore below)
          <input id="file-path" className="input mono" value={filePath} onChange={(e) => setFilePath(e.target.value)} spellCheck="false" autoComplete="off" />
        </label>
        <div className="chip-row" role="group" aria-label="Sample file paths">
          {GITIGNORE_SAMPLES.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => setFilePath(s)}>
              {s}
            </button>
          ))}
        </div>
        {ignored === null ? (
          <Callout tone="info" title="Type a path">
            Try .env, .env.example, or dist/index.html.
          </Callout>
        ) : ignored ? (
          <Callout tone="success" title="Ignored by Git">
            This file will not be committed, which is what you want for .env files that hold real secrets.
          </Callout>
        ) : (
          <Callout tone="info" title="Tracked by Git">
            This file would be committed. That is correct for source code and for .env.example, but never for real secrets.
          </Callout>
        )}
        <p className="muted small">
          <Globe size={13} aria-hidden="true" /> Anything in a VITE_ variable becomes public, so treat it as visible to every visitor.
        </p>
      </div>
    </div>
  );
}
