import { useState } from 'react';
import { ListChecks, Check, Circle, RotateCcw, LayoutDashboard, GraduationCap, ArrowRight, Pencil } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout } from '../components/InfoCard';
import { useApp } from '../context/AppState';
import { WORKFLOW_STEPS, PRACTICES, TOPIC_SUMMARY } from '../data/practices';
import { LEARNING_IDS, sectionById } from '../config/sections';

const VAGUE = /^(fix|fixes|update|updates|change|changes|stuff|misc|wip|asdf|test|commit)\.?$/i;

function checkMessage(msg) {
  const m = msg.trim();
  if (!m) return { tone: 'info', title: 'Type a message', text: 'For example: Add login validation.' };
  const problems = [];
  if (m.length < 10) problems.push('Too short to explain the change.');
  if (VAGUE.test(m) || /^(fix|update|change)s?( stuff| things| it)?$/i.test(m)) problems.push('Too vague: say what you fixed or updated.');
  if (m.length > 72) problems.push('Keep the first line under about 72 characters.');
  if (/^[a-z]/.test(m)) problems.push('Start with a capital letter and a verb, such as “Add” or “Fix”.');
  if (problems.length) return { tone: 'warning', title: 'Could be clearer', text: problems.join(' ') };
  return { tone: 'success', title: 'Clear and specific', text: 'A teammate can tell what changed without opening the diff.' };
}

export default function BestPractices() {
  const { repo, lab, deploy, envChecks, visited, go, restartTour, summary } = useApp();
  const [stepId, setStepId] = useState(WORKFLOW_STEPS[0].id);
  const [msg, setMsg] = useState('Add login validation');
  const step = WORKFLOW_STEPS.find((s) => s.id === stepId);
  const verdict = checkMessage(msg);

  const secDone = ['no-secrets', 'gitignore', 'platform', 'example'].every((k) => envChecks[k]);
  const checklist = [
    { id: 'commit', label: 'Made a commit in the simulator', done: repo.order.length > 0, section: 'git-basics' },
    { id: 'push', label: 'Pushed commits to the simulated remote', done: Object.keys(repo.remote).length > 0, section: 'git-basics' },
    { id: 'branch', label: 'Created a feature branch', done: Object.keys(repo.branches).length > 1 || repo.order.some((id) => repo.commits[id].branch !== 'main'), section: 'branching' },
    { id: 'merge', label: 'Completed a merge', done: summary.merges > 0, section: 'merging' },
    { id: 'conflict', label: 'Resolved a merge conflict', done: lab.stats.conflicts > 0, section: 'merging' },
    { id: 'pipeline', label: 'Ran a pipeline successfully', done: deploy.successes > 0, section: 'deployment' },
    { id: 'rollback', label: 'Practised a rollback', done: deploy.rollbacks > 0, section: 'deployment' },
    { id: 'security', label: 'Completed the security checklist', done: secDone, section: 'environment' },
    { id: 'tour', label: 'Visited every section', done: LEARNING_IDS.every((id) => visited.includes(id)), section: 'version-control' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  return (
    <>
      <SectionHeading icon={ListChecks} title="Best practices and conclusion">
        Good habits connect everything you have seen: small commits, branches, review, tests, safe configuration, and automated deployment.
      </SectionHeading>

      <InfoCard title="The complete workflow" icon={ListChecks}>
        <ol className="flow" aria-label="Complete workflow">
          {WORKFLOW_STEPS.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={`flow__step ${stepId === s.id ? 'is-selected' : ''}`} onClick={() => setStepId(s.id)} aria-pressed={stepId === s.id}>
                <span className="flow__num" aria-hidden="true">{i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
        <div className="stage-detail" aria-live="polite">
          <strong>{step.label}</strong>
          <p>{step.text}</p>
          <button type="button" className="btn btn--sm" onClick={() => go(step.section)}>
            Revisit {sectionById(step.section).label} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </InfoCard>

      <div className="grid grid--2">
        <InfoCard title="Best practices" icon={Check}>
          <ul className="practices">
            {PRACTICES.map((p) => (
              <li key={p.id}>
                <Check size={16} aria-hidden="true" />
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.text}</small>
                </span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="Try it: commit message check" icon={Pencil}>
          <label className="field" htmlFor="commit-msg">
            Write a commit message
            <input id="commit-msg" className="input" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={120} autoComplete="off" />
          </label>
          <div className="chip-row" role="group" aria-label="Examples">
            {['fix stuff', 'Update', 'Add login validation', 'Fix navbar overlap on mobile'].map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setMsg(s)}>{s}</button>
            ))}
          </div>
          <Callout tone={verdict.tone} title={verdict.title}>{verdict.text}</Callout>
        </InfoCard>
      </div>

      <InfoCard title="Your completion checklist" icon={GraduationCap} actions={<Badge tone={pct === 100 ? 'green' : 'amber'}>{doneCount} of {checklist.length}</Badge>}>
        <div className="progress progress--wide">
          <div className="progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Checklist completion"><span style={{ width: `${pct}%` }} /></div>
        </div>
        <p className="muted small">These items tick themselves as you use the simulations.</p>
        <ul className="checklist checklist--cols">
          {checklist.map((c) => (
            <li key={c.id} className={`todo ${c.done ? 'is-done' : ''}`}>
              {c.done ? <Check size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
              <span>{c.label}</span>
              <span className="sr-only">{c.done ? ' (done)' : ' (not done yet)'}</span>
              {!c.done && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => go(c.section)}>Go</button>
              )}
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard title="Summary of what you learned" icon={ListChecks}>
        <ul className="summary-list">
          {TOPIC_SUMMARY.map((t) => (
            <li key={t.section}>
              <button type="button" className="link-btn" onClick={() => go(t.section)}>{sectionById(t.section).label}</button>
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      </InfoCard>

      <section className="thanks card" aria-labelledby="thanks-title">
        <h2 id="thanks-title">Thank you. Questions?</h2>
        <p>Git records the story of a project. Branches keep it safe, CI/CD ships it, and good habits keep it healthy.</p>
        <div className="btn-row center">
          <button type="button" className="btn btn--primary" onClick={restartTour}>
            <RotateCcw size={16} aria-hidden="true" /> Restart the learning tour
          </button>
          <button type="button" className="btn" onClick={() => go('dashboard')}>
            <LayoutDashboard size={16} aria-hidden="true" /> Back to dashboard
          </button>
        </div>
      </section>
    </>
  );
}
