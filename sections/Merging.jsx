import { useState } from 'react';
import { GitMerge, GitCommitHorizontal, RotateCcw, FastForward, Shuffle, TriangleAlert, Check, Ban } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout } from '../components/InfoCard';
import BranchGraph from '../components/BranchGraph';
import CodeBlock from '../components/CodeBlock';
import TerminalSimulator from '../components/TerminalSimulator';
import { useApp } from '../context/AppState';
import { CONFLICT_TEXT, FEATURE, previewContent, validateResolution } from '../utils/mergeLab';

const CHOICES = [
  { id: 'current', label: 'Keep current (main)' },
  { id: 'incoming', label: 'Keep incoming (feature-login)' },
  { id: 'both', label: 'Keep both' },
  { id: 'custom', label: 'Write my own' },
];

function ConflictResolver() {
  const { lab, labActions } = useApp();
  const m = lab.merging;
  const res = lab.resolution;
  const preview = previewContent(m, res);
  const problem = res.choice ? validateResolution(preview) : null;
  const steps = [
    { label: 'Edit the file', done: Boolean(res.choice) },
    { label: 'Remove the markers', done: res.marked },
    { label: 'Stage and commit', done: res.staged },
  ];

  return (
    <InfoCard title={`Resolve the conflict in ${m.file}`} icon={TriangleAlert} tone="warning">
      <ol className="steps" aria-label="Conflict resolution steps">
        {steps.map((s, i) => (
          <li key={s.label} className={s.done ? 'is-done' : ''}>
            <span className="steps__num" aria-hidden="true">{s.done ? <Check size={14} /> : i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="conflict">
        <div className="conflict__file">
          <h4>File with conflict markers</h4>
          <CodeBlock title={m.file} code={CONFLICT_TEXT} copyable={false} />
        </div>
        <div className="conflict__sides">
          <div className="side side--current">
            <strong>Current change (HEAD on main)</strong>
            <code>{m.ours}</code>
          </div>
          <div className="side side--incoming">
            <strong>Incoming change (feature-login)</strong>
            <code>{m.theirs}</code>
          </div>
        </div>
      </div>

      <fieldset className="choices">
        <legend>Select the final content</legend>
        {CHOICES.map((c) => (
          <label key={c.id} className={`choice ${res.choice === c.id ? 'is-selected' : ''}`}>
            <input type="radio" name="resolution" value={c.id} checked={res.choice === c.id} onChange={() => labActions.choose(c.id)} />
            {c.label}
          </label>
        ))}
      </fieldset>

      {res.choice === 'custom' && (
        <label className="field" htmlFor="custom-resolution">
          Your resolved content
          <textarea id="custom-resolution" className="input mono" rows={3} value={res.custom} onChange={(e) => labActions.choose('custom', e.target.value)} spellCheck="false" />
        </label>
      )}
      {res.choice === 'both' && (
        <Callout tone="warning" title="Two title lines">
          Keeping both gives the file two title assignments. The later one wins, which is rarely what you intend. Usually you merge them into one line.
        </Callout>
      )}

      <div className="preview">
        <h4>Resolved file preview</h4>
        {preview === null ? (
          <p className="muted">Choose an option above to preview the result.</p>
        ) : (
          <>
            <CodeBlock title={`${m.file} (preview)`} code={preview} copyable={false} />
            {problem && <Callout tone="error" title="Not ready">{problem}</Callout>}
          </>
        )}
      </div>

      <div className="btn-row">
        <button type="button" className="btn" onClick={labActions.mark} disabled={!res.choice || res.marked}>
          <Check size={16} aria-hidden="true" /> Mark as resolved
        </button>
        <button type="button" className="btn" onClick={labActions.stage} disabled={!res.marked || res.staged}>
          Stage: git add {m.file}
        </button>
        <button type="button" className="btn btn--primary" onClick={labActions.commitResolution} disabled={!res.staged}>
          <GitCommitHorizontal size={16} aria-hidden="true" /> Commit the merge
        </button>
        <button type="button" className="btn btn--ghost" onClick={labActions.abort}>
          <Ban size={16} aria-hidden="true" /> Abort merge
        </button>
      </div>
    </InfoCard>
  );
}

export default function Merging() {
  const { lab, labActions } = useApp();
  const [editTitle, setEditTitle] = useState(false);
  const featureAhead = lab.branches[FEATURE] !== lab.branches.main;
  const outcome = lab.lastOutcome;
  const kind = editTitle ? 'title' : 'plain';

  return (
    <>
      <SectionHeading icon={GitMerge} title="Merging and merge conflicts">
        Merging combines the work of two branches. Most merges are automatic; when two branches change the same lines, you decide the result.
      </SectionHeading>

      <Callout tone="info" title="A practice workspace, not a real repository">
        This lab keeps its own simulated history. It never reads or changes a real Git repository.
      </Callout>

      <div className="grid grid--3">
        <InfoCard title="Fast-forward" icon={FastForward}>
          <p>main has not moved since the branch started, so Git simply moves the main pointer forward. No merge commit.</p>
          <button type="button" className="btn btn--sm" onClick={() => labActions.preset('fast-forward')}>Load this scenario</button>
        </InfoCard>
        <InfoCard title="Three-way merge" icon={Shuffle}>
          <p>Both branches advanced. Git combines both histories and creates a merge commit with two parents.</p>
          <button type="button" className="btn btn--sm" onClick={() => labActions.preset('three-way')}>Load this scenario</button>
        </InfoCard>
        <InfoCard title="Merge conflict" icon={TriangleAlert}>
          <p>Both branches changed the same lines. Git cannot choose, so it stops and asks you.</p>
          <button type="button" className="btn btn--sm" onClick={() => labActions.preset('conflict')}>Load this scenario</button>
        </InfoCard>
      </div>

      <InfoCard title="Merge workspace" icon={GitMerge} actions={<Badge tone="amber">Simulation</Badge>}>
        <BranchGraph commits={lab.commits} order={lab.order} branches={lab.branches} current="main" label="Merge workspace" />
        <div className="workspace-controls">
          <fieldset className="workspace-controls__group" disabled={Boolean(lab.merging)}>
            <legend>Let the branches evolve</legend>
            <label className="check">
              <input type="checkbox" checked={editTitle} onChange={(e) => setEditTitle(e.target.checked)} />
              Edit the page title line (the file both branches might touch)
            </label>
            <div className="btn-row">
              <button type="button" className="btn btn--sm" onClick={() => labActions.commit('main', kind)}>
                <GitCommitHorizontal size={14} aria-hidden="true" /> Commit on main
              </button>
              <button type="button" className="btn btn--sm" onClick={() => labActions.commit(FEATURE, kind)}>
                <GitCommitHorizontal size={14} aria-hidden="true" /> Commit on feature-login
              </button>
            </div>
          </fieldset>
          <div className="workspace-controls__group">
            <p className="small muted">Then merge into main:</p>
            <CodeBlock title="Commands" code={`git switch main\ngit merge ${FEATURE}`} copyable={false} />
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={labActions.merge} disabled={Boolean(lab.merging)}>
                <GitMerge size={16} aria-hidden="true" /> Merge {FEATURE} into main
              </button>
              <button type="button" className="btn btn--ghost" onClick={labActions.reset}>
                <RotateCcw size={16} aria-hidden="true" /> Reset lab
              </button>
            </div>
            {!featureAhead && !lab.merging && <p className="muted small">feature-login has no new commits yet. Add one or load a scenario.</p>}
          </div>
        </div>

        {outcome?.type === 'fast-forward' && <Callout tone="success" title="Fast-forward merge">main moved straight to the tip of feature-login. Notice there is no merge commit, and main now points at commits drawn on the feature lane.</Callout>}
        {outcome?.type === 'three-way' && <Callout tone="success" title="Three-way merge">Git combined both histories and created a merge commit (filled dot) with two parents.</Callout>}
        {outcome?.type === 'conflict' && <Callout tone="warning" title="Merge stopped">Both branches changed the same lines. Resolve the conflict below to finish.</Callout>}
        {outcome?.type === 'conflict-resolved' && (
          <Callout tone="success" title="Conflict resolved and committed">
            The final file contains: <code>{outcome.content.replace(/\n/g, ' / ')}</code>
          </Callout>
        )}
      </InfoCard>

      {lab.merging && <ConflictResolver />}

      <div className="grid grid--2">
        <InfoCard title="Merge terminal output" icon={GitMerge}>
          <TerminalSimulator readOnly log={lab.log.slice(-6)} height={200} title="Merge lab terminal" emptyText="Merge output appears here." />
        </InfoCard>
        <InfoCard title="Three steps to resolve a conflict" icon={Check}>
          <ol className="plain-list">
            <li><strong>Edit the file.</strong> Decide what the final content should be.</li>
            <li><strong>Remove the conflict markers.</strong> Delete the lines starting with &lt;&lt;&lt;&lt;&lt;&lt;&lt;, =======, and &gt;&gt;&gt;&gt;&gt;&gt;&gt;.</li>
            <li><strong>Stage and commit.</strong> <code>git add</code> the file, then <code>git commit</code> to finish the merge.</li>
          </ol>
          <CodeBlock title="In a real terminal" code={`git switch main\ngit merge ${FEATURE}\n# fix app.config in your editor, remove the markers\ngit add app.config\ngit commit`} />
        </InfoCard>
      </div>
    </>
  );
}
