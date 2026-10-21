import { useState } from 'react';
import { History, Users, Undo2, UserCheck, GitCompare, Server, Laptop, ArrowUp, ArrowDown, GitCommitHorizontal } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout } from '../components/InfoCard';
import GitTimeline from '../components/GitTimeline';
import CodeBlock from '../components/CodeBlock';
import { VERSION_HISTORY, BENEFITS, COMPARISON_ROWS, TEAM } from '../data/versionHistory';
import { useApp } from '../context/AppState';

const BENEFIT_ICONS = { collaboration: Users, recovery: Undo2, accountability: UserCheck, tracking: GitCompare };

function Topology({ mode }) {
  const people = TEAM;
  const xs = [110, 320, 530];
  if (mode === 'central') {
    return (
      <svg className="diagram" viewBox="0 0 640 290" role="img" aria-label="Centralized version control: Alice, Bob, and Chen all connect to one central server that holds the history.">
        <rect x="220" y="14" width="200" height="74" rx="8" className="diagram__box diagram__box--server" />
        <text x="320" y="44" textAnchor="middle" className="diagram__title">Central server</text>
        <text x="320" y="64" textAnchor="middle" className="diagram__text">The only full history</text>
        <text x="320" y="80" textAnchor="middle" className="diagram__text">SVN, CVS</text>
        {people.map((p, i) => (
          <g key={p}>
            <line x1={xs[i]} y1="200" x2="320" y2="88" className="diagram__link" />
            <rect x={xs[i] - 80} y="200" width="160" height="70" rx="8" className="diagram__box" />
            <text x={xs[i]} y="226" textAnchor="middle" className="diagram__title">{p}</text>
            <text x={xs[i]} y="246" textAnchor="middle" className="diagram__text">Working copy only</text>
            <text x={xs[i]} y="261" textAnchor="middle" className="diagram__text">needs the server</text>
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg className="diagram" viewBox="0 0 640 290" role="img" aria-label="Distributed version control: Alice, Bob, and Chen each hold a full clone of the history and share through a remote repository.">
      <rect x="220" y="14" width="200" height="74" rx="8" className="diagram__box diagram__box--server" />
      <text x="320" y="44" textAnchor="middle" className="diagram__title">Shared remote</text>
      <text x="320" y="64" textAnchor="middle" className="diagram__text">GitHub or GitLab</text>
      <text x="320" y="80" textAnchor="middle" className="diagram__text">Git</text>
      {people.map((p, i) => (
        <g key={p}>
          <line x1={xs[i]} y1="190" x2="320" y2="88" className="diagram__link diagram__link--dist" />
          <rect x={xs[i] - 80} y="190" width="160" height="84" rx="8" className="diagram__box" />
          <text x={xs[i]} y="214" textAnchor="middle" className="diagram__title">{p}</text>
          <text x={xs[i]} y="232" textAnchor="middle" className="diagram__text">Full local clone</text>
          {[0, 1, 2, 3].map((n) => (
            <circle key={n} cx={xs[i] - 36 + n * 24} cy="256" r="6" className="diagram__commit" />
          ))}
        </g>
      ))}
    </svg>
  );
}

function SharedRepo() {
  const { notify } = useApp();
  const [remote, setRemote] = useState([]);
  const [local, setLocal] = useState({ Alice: [], Bob: [], Chen: [] });
  const [counter, setCounter] = useState(1);

  const commit = (name) => {
    const id = `${name[0]}${counter}`;
    setCounter((c) => c + 1);
    setLocal((l) => ({ ...l, [name]: [...l[name], id] }));
  };
  const push = (name) => {
    const mine = local[name];
    const upToDate = remote.every((c, i) => mine[i] === c);
    if (!upToDate) {
      notify('warning', `${name}'s push was rejected: the remote has commits ${name} does not have. Pull first, then push.`);
      return;
    }
    if (mine.length === remote.length) {
      notify('info', `${name} has nothing new to push.`);
      return;
    }
    setRemote(mine);
    notify('success', `${name} pushed ${mine.length - remote.length} commit(s) to the shared repository.`);
  };
  const pull = (name) => {
    const unpushed = local[name].filter((c) => !remote.includes(c));
    setLocal((l) => ({ ...l, [name]: [...remote, ...unpushed] }));
    notify('success', `${name} pulled the latest history from the remote.`);
  };

  return (
    <div className="shared">
      <div className="shared__remote">
        <Server size={18} aria-hidden="true" />
        <strong>Shared repository</strong>
        <span className="shared__chips" aria-label="Commits on the remote">
          {remote.length ? remote.map((c) => <span key={c} className="commit-chip">{c}</span>) : <em className="muted">empty</em>}
        </span>
      </div>
      <div className="grid grid--3">
        {TEAM.map((name) => (
          <div key={name} className="shared__dev">
            <div className="shared__dev-head">
              <Laptop size={16} aria-hidden="true" />
              <strong>{name}</strong>
            </div>
            <div className="shared__chips" aria-label={`${name}'s local history`}>
              {local[name].length ? local[name].map((c) => <span key={c} className={`commit-chip ${remote.includes(c) ? '' : 'is-local'}`}>{c}</span>) : <em className="muted">no commits</em>}
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn--sm" onClick={() => commit(name)}>
                <GitCommitHorizontal size={14} aria-hidden="true" /> Commit
              </button>
              <button type="button" className="btn btn--sm" onClick={() => push(name)}>
                <ArrowUp size={14} aria-hidden="true" /> Push
              </button>
              <button type="button" className="btn btn--sm" onClick={() => pull(name)}>
                <ArrowDown size={14} aria-hidden="true" /> Pull
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="muted small">Filled chips are shared with the remote; outlined chips exist only on that developer’s computer. Try committing as Alice and Bob, push both, and read the warning.</p>
    </div>
  );
}

export default function VersionControl() {
  const [selectedId, setSelectedId] = useState(VERSION_HISTORY[VERSION_HISTORY.length - 1].id);
  const [restoredId, setRestoredId] = useState(null);
  const [mode, setMode] = useState('distributed');
  const selected = VERSION_HISTORY.find((v) => v.id === selectedId);
  const latestId = VERSION_HISTORY[VERSION_HISTORY.length - 1].id;
  const shownVersion = restoredId || latestId;

  return (
    <>
      <SectionHeading icon={History} title="Version control">
        A system that records changes to files over time, so you can see what changed, who changed it, and go back to an earlier version.
      </SectionHeading>

      <div className="grid grid--4">
        {BENEFITS.map((b) => {
          const Icon = BENEFIT_ICONS[b.id];
          return (
            <InfoCard key={b.id} icon={Icon} title={b.title}>
              <p>{b.text}</p>
            </InfoCard>
          );
        })}
      </div>

      <div className="grid grid--2">
        <InfoCard title="Project timeline" icon={History}>
          <p className="muted">Select a version to see who changed what, when, and why.</p>
          <GitTimeline items={VERSION_HISTORY} selectedId={selectedId} onSelect={setSelectedId} />
        </InfoCard>
        <InfoCard title={`Version ${selected.id}`} icon={GitCompare} actions={<Badge tone="blue">{selected.file}</Badge>}>
          <dl className="facts">
            <div><dt>Who</dt><dd>{selected.author}</dd></div>
            <div><dt>What</dt><dd>{selected.message}</dd></div>
            <div><dt>When</dt><dd>{selected.timeLabel}</dd></div>
            <div><dt>Why</dt><dd>{selected.why}</dd></div>
          </dl>
          <div className="diff" role="group" aria-label={`Changes in ${selected.file}`}>
            {selected.diff.map((d, i) => (
              <div key={i} className={`diff__line diff__line--${d.type}`}>
                <span className="diff__sign" aria-hidden="true">{d.type === 'add' ? '+' : d.type === 'del' ? '−' : ' '}</span>
                <span className="sr-only">{d.type === 'add' ? 'added: ' : d.type === 'del' ? 'removed: ' : 'unchanged: '}</span>
                <code>{d.text}</code>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn--sm" onClick={() => setRestoredId(selected.id)} disabled={restoredId === selected.id}>
              <Undo2 size={14} aria-hidden="true" /> Restore this version
            </button>
            {restoredId && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRestoredId(null)}>
                Return to latest
              </button>
            )}
          </div>
          <Callout tone={restoredId ? 'warning' : 'success'} title={restoredId ? `Project restored to ${shownVersion} (simulated)` : `Project is at the latest version, ${latestId}`}>
            {restoredId ? 'Later changes are not lost. They stay in history and you can return to them.' : 'Pick an older version and restore it to see how recovery works.'}
          </Callout>
        </InfoCard>
      </div>

      <InfoCard title="Centralized vs distributed" icon={Server}>
        <div className="segmented" role="group" aria-label="Choose a model">
          <button type="button" className={mode === 'central' ? 'is-active' : ''} onClick={() => setMode('central')} aria-pressed={mode === 'central'}>
            Centralized
          </button>
          <button type="button" className={mode === 'distributed' ? 'is-active' : ''} onClick={() => setMode('distributed')} aria-pressed={mode === 'distributed'}>
            Distributed
          </button>
        </div>
        <div className="grid grid--2-1">
          <Topology mode={mode} />
          <div>
            {mode === 'central' ? (
              <>
                <h4>One central server</h4>
                <p>Developers check files out from a single server and commit back to it. If the server is down, nobody can save history. Examples: SVN and CVS.</p>
              </>
            ) : (
              <>
                <h4>Every clone has the history</h4>
                <p>Each developer’s clone contains the complete project history, so most work happens offline and any clone can restore the project. Example: Git.</p>
              </>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Centralized versus distributed version control</caption>
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Centralized</th>
                <th scope="col">Distributed</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.central}</td>
                  <td>{r.distributed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoCard>

      <InfoCard title="Shared repository: Alice, Bob, and Chen" icon={Users}>
        <p className="muted">Each person works on their own clone. Commits stay local until pushed; a push is rejected if the remote has moved on.</p>
        <SharedRepo />
      </InfoCard>

      <InfoCard title="Comparing changes in practice" icon={GitCompare}>
        <p>Developers compare versions with a diff. In a real repository these commands answer who, what, when, and why:</p>
        <CodeBlock title="Run in your real terminal" code={`git log --oneline        # who and when, one line per commit\ngit show 7be42d1        # what changed in one commit\ngit diff a1f3c9e 3fe8b27  # compare any two versions`} />
      </InfoCard>
    </>
  );
}
