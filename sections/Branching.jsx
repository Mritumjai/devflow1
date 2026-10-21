import { GitBranch, Plus, Undo2, Trash2, GitCommitHorizontal, GitMerge, ShieldCheck, Users, FlaskConical, ArrowRight } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout, EmptyState } from '../components/InfoCard';
import BranchGraph from '../components/BranchGraph';
import TerminalSimulator from '../components/TerminalSimulator';
import GitTimeline from '../components/GitTimeline';
import CodeBlock from '../components/CodeBlock';
import { useApp } from '../context/AppState';
import { branchLog, reachable } from '../utils/commandSimulator';
import { plural } from '../utils/format';

const FEATURE = 'feature-login';

export default function Branching() {
  const { repo, runGit, runGitAndNotify, quickCommit, seedRepo, go } = useApp();
  const ready = repo.initialized && repo.order.length > 0 && repo.branches.main;
  const branches = Object.keys(repo.branches).filter((b) => repo.branches[b]);
  const featureExists = branches.includes(FEATURE);
  const onFeature = repo.current === FEATURE;
  const onMain = repo.current === 'main';

  let deleteState = { tone: 'info', text: 'Create feature-login to try deleting it.' };
  if (featureExists) {
    const merged = reachable(repo, repo.branches.main).has(repo.branches[FEATURE]);
    if (onFeature) deleteState = { tone: 'warning', text: 'You are on feature-login. Git will not delete the branch you are standing on. Switch to main first.' };
    else if (merged) deleteState = { tone: 'success', text: 'Safe to delete: every commit on feature-login is already in main.' };
    else deleteState = { tone: 'warning', text: 'Not safe: feature-login has commits that main does not. Merge it first, or deleting would lose that work.' };
  }
  const unmerged = featureExists && !onFeature && deleteState.tone === 'warning';

  const mainCommits = ready ? branchLog(repo, 'main') : [];
  const featureOnly = featureExists ? branchLog(repo, FEATURE).filter((c) => !reachable(repo, repo.branches.main).has(c.id)) : [];

  if (!ready) {
    return (
      <>
        <SectionHeading icon={GitBranch} title="Branching">
          A branch is an independent line of development. You build a feature on its own branch instead of changing main directly.
        </SectionHeading>
        <InfoCard>
          <EmptyState icon={GitBranch} title="You need a repository with one commit" action={<button type="button" className="btn btn--primary" onClick={seedRepo}>Create starter repository</button>}>
            This simulates git init, git add ., and git commit. You can also do it yourself in Git basics.
          </EmptyState>
          <div className="btn-row center">
            <button type="button" className="btn btn--ghost" onClick={() => go('git-basics')}>Open Git basics <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </InfoCard>
      </>
    );
  }

  return (
    <>
      <SectionHeading icon={GitBranch} title="Branching">
        A branch is an independent line of development. You build a feature on its own branch instead of changing main directly.
      </SectionHeading>

      <InfoCard title="Branch visualizer" icon={GitBranch} actions={<Badge tone="amber">Simulation</Badge>}>
        <BranchGraph commits={repo.commits} order={repo.order} branches={repo.branches} current={repo.current} remote={repo.remote} placeholderLanes={['main', FEATURE]} label="Branch visualizer" />
        <p className="muted small">The filled ring marks HEAD, the branch you are working on. Each dot is a commit.</p>
      </InfoCard>

      <div className="grid grid--2">
        <InfoCard title="Controls" icon={Plus}>
          <p>
            Active branch: <Badge tone="cyan">{repo.current}</Badge>
          </p>
          <div className="control-list">
            <div className="control">
              <button type="button" className="btn btn--primary" onClick={() => runGitAndNotify(`git switch -c ${FEATURE}`, 'Created feature-login and switched to it.')} disabled={featureExists}>
                <Plus size={16} aria-hidden="true" /> Create {FEATURE}
              </button>
              {featureExists && <span className="muted small">Already created.</span>}
            </div>
            <div className="control">
              <button type="button" className="btn" onClick={() => runGitAndNotify('git switch main', 'Switched to main.')} disabled={onMain}>
                <Undo2 size={16} aria-hidden="true" /> Return to main
              </button>
              <button type="button" className="btn" onClick={() => runGitAndNotify(`git switch ${FEATURE}`, 'Switched to feature-login.')} disabled={!featureExists || onFeature}>
                <GitBranch size={16} aria-hidden="true" /> Switch to {FEATURE}
              </button>
            </div>
            <div className="control">
              <button type="button" className="btn" onClick={quickCommit}>
                <GitCommitHorizontal size={16} aria-hidden="true" /> Add a commit to {repo.current}
              </button>
            </div>
            <div className="control">
              <button type="button" className="btn" onClick={() => runGitAndNotify(`git merge ${FEATURE}`, 'Merged feature-login into main.')} disabled={!featureExists || !onMain}>
                <GitMerge size={16} aria-hidden="true" /> Merge {FEATURE} into main
              </button>
              {featureExists && !onMain && <span className="muted small">Switch to main to merge into it.</span>}
            </div>
            <div className="control">
              <button type="button" className="btn btn--danger-outline" onClick={() => runGitAndNotify(`git branch -d ${FEATURE}`, 'Deleted feature-login.')} disabled={!featureExists}>
                <Trash2 size={16} aria-hidden="true" /> Check and delete {FEATURE}
              </button>
              {unmerged && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => runGitAndNotify(`git branch -D ${FEATURE}`, 'Force-deleted feature-login. Its unmerged commits are no longer on any branch.')}>
                  Force delete (-D)
                </button>
              )}
            </div>
          </div>
          <Callout tone={deleteState.tone} title="Can feature-login be deleted?">{deleteState.text}</Callout>
        </InfoCard>

        <InfoCard title="Try the commands" icon={FlaskConical}>
          <TerminalSimulator log={repo.log.slice(-8)} onRun={runGit} quick={['git branch', `git switch -c ${FEATURE}`, 'git switch main', 'git log --oneline']} height={250} title="Branch terminal" prompt={`(${repo.current})`} emptyText="Run a command or use the buttons." />
        </InfoCard>
      </div>

      <div className="grid grid--2">
        <InfoCard title="Commit history: main" icon={GitBranch}>
          <GitTimeline items={mainCommits} />
          <p className="muted small">main has {plural(mainCommits.length, 'commit')}.</p>
        </InfoCard>
        <InfoCard title={`Commit history: ${FEATURE}`} icon={GitBranch}>
          {featureExists ? (
            <>
              <GitTimeline items={branchLog(repo, FEATURE)} />
              <p className="muted small">{featureOnly.length ? `${plural(featureOnly.length, 'commit')} exist only on this branch.` : 'Everything here is already on main.'}</p>
            </>
          ) : (
            <EmptyState icon={GitBranch} title="Branch not created">Create feature-login to see its history.</EmptyState>
          )}
        </InfoCard>
      </div>

      <InfoCard title="Why keep unfinished work off main?" icon={ShieldCheck}>
        <div className="stability">
          <div className="stability__col is-stable">
            <strong>main</strong>
            <Badge tone="green">stable</Badge>
            <p>{featureOnly.length ? `Still unchanged by the ${plural(featureOnly.length, 'unfinished commit')} on feature-login.` : 'Contains only finished, working code.'}</p>
          </div>
          <div className="stability__col is-wip">
            <strong>{FEATURE}</strong>
            <Badge tone="amber">{featureExists ? 'work in progress' : 'not started'}</Badge>
            <p>{featureExists ? 'Experiments and half-finished code live here until reviewed.' : 'A safe place to start is one command away.'}</p>
          </div>
        </div>
      </InfoCard>

      <div className="grid grid--3">
        <InfoCard title="Feature isolation" icon={ShieldCheck}><p>Each feature lives on its own branch, so a bug in the login form cannot break the homepage.</p></InfoCard>
        <InfoCard title="Parallel teamwork" icon={Users}><p>Asha builds login while Ravi fixes the navbar. Neither waits for the other.</p></InfoCard>
        <InfoCard title="Safe experimentation" icon={FlaskConical}><p>Not happy with an idea? Delete the branch. main never knew about it.</p></InfoCard>
      </div>

      <InfoCard title="Commands in a real terminal" icon={GitBranch}>
        <CodeBlock title="Branch commands" code={`git branch                    # list branches\ngit switch -c ${FEATURE}   # create and switch\ngit switch main               # go back to main`} />
      </InfoCard>
    </>
  );
}
