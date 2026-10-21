import { liveVersion, BASELINE } from './deploySim';
import { unpushedCount } from './commandSimulator';

/** One place that turns the simulation state into numbers the UI can show. */
export function summarizeProject({ repo, lab, deploy, visited }) {
  const commits = repo.order.length;
  const branchNames = Object.keys(repo.branches).filter((b) => repo.branches[b]);
  const current = repo.current;
  const unpushed = current && repo.branches[current] ? unpushedCount(repo, current) : 0;
  const mainPushed = Boolean(repo.branches.main) && repo.remote.main === repo.branches.main;
  const authors = [...new Set(repo.order.map((id) => repo.commits[id].author))];
  const merges = (repo.stats?.merges || 0) + (lab.stats?.merges || 0);
  const conflictsResolved = lab.stats?.conflicts || 0;
  const production = liveVersion(deploy, 'production');
  const run = deploy.run;

  const statuses = {
    code: commits > 0 ? 'done' : repo.initialized || repo.working.length ? 'active' : 'pending',
    git: mainPushed ? 'done' : commits > 0 ? 'active' : 'pending',
    cloud: run?.status === 'failed' ? 'failed' : deploy.successes > 0 ? 'done' : run?.status === 'in-progress' || mainPushed ? 'active' : 'pending',
    live: production !== BASELINE ? 'done' : 'pending',
  };

  return {
    commits,
    branchNames,
    current,
    unpushed,
    mainPushed,
    authors,
    merges,
    conflictsResolved,
    production,
    run,
    statuses,
    visitedCount: visited.length,
  };
}
