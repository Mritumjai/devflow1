import { GitBranch, GitCommitHorizontal, UploadCloud, Rocket, Layers } from 'lucide-react';
import { useApp } from '../context/AppState';
import { plural } from '../utils/format';

function Item({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <li className={`status__item status__item--${tone}`}>
      <Icon size={14} aria-hidden="true" />
      <span className="status__label">{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

export default function StatusPanel() {
  const { repo, summary, deploy } = useApp();
  const { commits, current, unpushed, production, run } = summary;
  const staged = repo.staged.length;
  const runText = !run ? 'idle' : run.status === 'in-progress' ? 'running' : run.status === 'failed' ? 'failed' : 'passed';
  const runTone = !run ? 'neutral' : run.status === 'failed' ? 'red' : run.status === 'in-progress' ? 'amber' : 'green';

  return (
    <section className="status" aria-label="Project status">
      <ul>
        <Item icon={GitBranch} label="Branch" value={repo.initialized ? current : 'no repository'} tone={repo.initialized ? 'cyan' : 'neutral'} />
        <Item icon={Layers} label="Staged" value={plural(staged, 'file')} tone={staged ? 'amber' : 'neutral'} />
        <Item icon={GitCommitHorizontal} label="Commits" value={commits} />
        <Item icon={UploadCloud} label="Unpushed" value={commits ? unpushed : 0} tone={unpushed ? 'amber' : 'green'} />
        <Item icon={Rocket} label="CI run" value={runText} tone={runTone} />
        <Item icon={Rocket} label="Production" value={`${production} (simulated)`} tone="blue" />
      </ul>
      <span className="sr-only">{deploy.runs} pipeline runs so far.</span>
    </section>
  );
}
