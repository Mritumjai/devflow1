import { useState } from 'react';
import { LayoutDashboard, History, GitBranch, GitMerge, Rocket, Terminal, ArrowRight, Check } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, EmptyState } from '../components/InfoCard';
import BranchGraph from '../components/BranchGraph';
import TerminalSimulator from '../components/TerminalSimulator';
import PipelineStepper from '../components/PipelineStepper';
import GitTimeline from '../components/GitTimeline';
import { useApp } from '../context/AppState';
import { SECTIONS } from '../config/sections';
import { DASHBOARD_STAGES } from '../data/deployment';
import { recentCommits } from '../utils/commandSimulator';
import { plural } from '../utils/format';

function SummaryCard({ icon: Icon, title, value, detail, target }) {
  const { go } = useApp();
  return (
    <article className="summary-card">
      <div className="summary-card__top">
        <Icon size={18} aria-hidden="true" />
        <h3>{title}</h3>
      </div>
      <p className="summary-card__value">{value}</p>
      <p className="summary-card__detail">{detail}</p>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => go(target)}>
        Open section <ArrowRight size={14} aria-hidden="true" />
      </button>
    </article>
  );
}

export default function Dashboard() {
  const { repo, lab, deploy, summary, go, seedRepo, visited } = useApp();
  const [stageId, setStageId] = useState('code');
  const { commits, branchNames, current, authors, merges, conflictsResolved, production, statuses, unpushed } = summary;

  const stageText = {
    code: commits
      ? `${plural(commits, 'commit')} saved locally${repo.staged.length ? `, ${plural(repo.staged.length, 'file')} staged` : ''}.`
      : 'No commits yet. Run git init, git add, and git commit in Git basics.',
    git: summary.mainPushed
      ? 'main is published to the simulated remote.'
      : commits
        ? `${plural(unpushed, 'commit')} on ${current} not pushed yet. Try git push origin main.`
        : 'Nothing to push until you make a commit.',
    cloud: deploy.run
      ? `Run #${deploy.run.id} is ${deploy.run.status === 'in-progress' ? 'in progress' : deploy.run.status}. Open Deployment to inspect each stage.`
      : 'No pipeline run yet. A push to main would trigger one.',
    live: `Production serves ${production} (simulated).${production === 'v1.0.0' ? ' That is the baseline release; run the pipeline to ship a new one.' : ''}`,
  };
  const stageTargets = { code: 'git-basics', git: 'git-basics', cloud: 'deployment', live: 'deployment' };
  const stage = DASHBOARD_STAGES.find((s) => s.id === stageId);

  return (
    <>
      <SectionHeading icon={LayoutDashboard} title="DevFlow: Git and modern software development">
        An interactive playground for the ideas behind a professional workflow. Everything on this page reflects what you do in the other sections, and every Git action is a simulation.
      </SectionHeading>

      <section className="hero card" aria-labelledby="explore-title">
        <div>
          <h2 id="explore-title">Explore the workflow</h2>
          <p>
            A change travels from your editor to Git, through automated checks, and out to users. Try each step yourself and watch the numbers below change.
          </p>
        </div>
        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={() => go('git-basics')}>
            <Terminal size={16} aria-hidden="true" /> Try Git commands
          </button>
          <button type="button" className="btn" onClick={() => go('branching')}>
            <GitBranch size={16} aria-hidden="true" /> Create a branch
          </button>
          <button type="button" className="btn" onClick={() => go('merging')}>
            <GitMerge size={16} aria-hidden="true" /> Resolve a conflict
          </button>
          <button type="button" className="btn" onClick={() => go('deployment')}>
            <Rocket size={16} aria-hidden="true" /> Run the pipeline
          </button>
        </div>
      </section>

      <div className="grid grid--4">
        <SummaryCard
          icon={History}
          title="Version control"
          value={plural(commits, 'commit')}
          detail={authors.length ? `By ${authors.join(', ')}` : 'No history recorded yet'}
          target="version-control"
        />
        <SummaryCard
          icon={GitBranch}
          title="Branching"
          value={plural(branchNames.length, 'branch', 'es')}
          detail={repo.initialized && current ? `Currently on ${current}` : 'Repository not initialized'}
          target="branching"
        />
        <SummaryCard
          icon={GitMerge}
          title="Merging"
          value={plural(merges, 'merge')}
          detail={`${plural(conflictsResolved, 'conflict')} resolved`}
          target="merging"
        />
        <SummaryCard
          icon={Rocket}
          title="Deployment"
          value={`${production}`}
          detail={`${plural(deploy.runs, 'pipeline run')}, ${deploy.rollbacks} rollback${deploy.rollbacks === 1 ? '' : 's'} (simulated)`}
          target="deployment"
        />
      </div>

      <div className="grid grid--2-1">
        <InfoCard title="Branch graph" icon={GitBranch} actions={<Badge tone="amber">Simulation</Badge>}>
          {commits === 0 ? (
            <EmptyState icon={GitBranch} title="No commits to draw yet" action={<button type="button" className="btn btn--primary btn--sm" onClick={seedRepo}>Create starter repository</button>}>
              This runs git init, git add, and git commit in the simulator so main appears here.
            </EmptyState>
          ) : (
            <BranchGraph commits={repo.commits} order={repo.order} branches={repo.branches} current={repo.current} remote={repo.remote} placeholderLanes={['main', 'feature-login']} label="Repository branch graph" />
          )}
        </InfoCard>
        <InfoCard title="Recent terminal activity" icon={Terminal}>
          <TerminalSimulator readOnly log={repo.log.slice(-6)} height={230} title="Mini terminal" emptyText="No commands yet. Open Git basics and run git init." />
        </InfoCard>
      </div>

      <div className="grid grid--2">
        <InfoCard title="Development pipeline" icon={Rocket}>
          <PipelineStepper stages={DASHBOARD_STAGES} statuses={statuses} selectedId={stageId} onSelect={setStageId} label="Code, Git, Cloud, Live" />
          <div className="stage-detail" aria-live="polite">
            <strong>{stage.label}</strong>
            <p>{stage.text}</p>
            <p className="muted">{stageText[stageId]}</p>
            <button type="button" className="btn btn--sm" onClick={() => go(stageTargets[stageId])}>
              Go to demonstration <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </InfoCard>
        <InfoCard title="Recent commits" icon={History}>
          <GitTimeline items={recentCommits(repo, 5)} emptyText="No commits yet. Make one in Git basics or Branching." />
        </InfoCard>
      </div>

      <InfoCard title="Quick navigation" icon={ArrowRight}>
        <ul className="quick-nav">
          {SECTIONS.filter((s) => s.id !== 'dashboard').map((s) => {
            const Icon = s.icon;
            const done = visited.includes(s.id);
            return (
              <li key={s.id}>
                <button type="button" className="quick-nav__item" onClick={() => go(s.id)}>
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{s.label}</strong>
                    <small>{s.summary}</small>
                  </span>
                  {done && (
                    <span className="quick-nav__done">
                      <Check size={14} aria-hidden="true" />
                      <span className="sr-only">visited</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </InfoCard>
    </>
  );
}
