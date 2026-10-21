/** Simulated CI/CD pipeline. Nothing here deploys anything. */
import { SCHEMA } from './commandSimulator';

export const BASELINE = 'v1.0.0';
export const ENVIRONMENTS = ['development', 'staging', 'production'];
export const STAGE_IDS = ['code', 'build', 'test', 'deploy', 'monitor'];

export function createDeploy(now = Date.now()) {
  return {
    v: SCHEMA,
    next: 1,
    history: { development: [BASELINE], staging: [BASELINE], production: [BASELINE] },
    target: 'production',
    willFail: false,
    run: null,
    runs: 0,
    successes: 0,
    failures: 0,
    rollbacks: 0,
    lastRollback: null,
    log: [{ id: 1, time: now, level: 'info', text: 'Baseline release v1.0.0 is live in every environment (simulated).' }],
    logSeq: 1,
  };
}

function pushLog(d, level, text, now) {
  const id = d.logSeq + 1;
  return { ...d, logSeq: id, log: [...d.log, { id, time: now, level, text }].slice(-60) };
}

export const liveVersion = (d, env = 'production') => d.history[env][d.history[env].length - 1];

export function startRun(d, { message, now = Date.now() }) {
  if (d.run && d.run.status === 'in-progress') {
    return { state: d, level: 'warning', message: 'A run is already in progress. Advance it or let it finish.' };
  }
  const msg = message || 'Update project files';
  const runNo = d.runs + 1;
  let s = {
    ...d,
    runs: runNo,
    run: {
      id: runNo,
      message: msg,
      target: d.target,
      version: `v1.${d.next}.0`,
      willFail: d.willFail,
      stages: ['done', 'pending', 'pending', 'pending', 'pending'],
      status: 'in-progress',
    },
  };
  s = pushLog(s, 'info', '$ git push origin main  (simulated)', now);
  s = pushLog(s, 'ok', `Code stage complete. CI triggered by "${msg}" for ${d.target}.`, now);
  return { state: s, level: 'success', message: `Pipeline run #${runNo} started (simulated).` };
}

export function advanceRun(d, now = Date.now()) {
  const run = d.run;
  if (!run || run.status !== 'in-progress') return { state: d, level: 'info', message: 'Start a run first.' };
  const i = run.stages.indexOf('pending');
  if (i === -1) return { state: d, level: 'info', message: 'This run has no stages left.' };
  const stages = [...run.stages];
  let s = d;
  let level = 'success';
  let message = '';
  const id = STAGE_IDS[i];

  if (id === 'build') {
    stages[i] = 'done';
    s = pushLog(s, 'info', 'Build: installing dependencies and bundling with Vite…', now);
    s = pushLog(s, 'ok', 'Build: dist/ created (simulated).', now);
    message = 'Build finished.';
  } else if (id === 'test') {
    if (run.willFail) {
      stages[i] = 'failed';
      s = pushLog(s, 'info', 'Test: running 12 automated checks…', now);
      s = pushLog(s, 'err', 'Test: 10 passed, 2 failed — "login form validates email".', now);
      s = pushLog(s, 'warn', `Deploy blocked. ${liveVersion(d, run.target)} stays live in ${run.target}.`, now);
      s = { ...s, failures: s.failures + 1, run: { ...run, stages, status: 'failed' } };
      return { state: s, level: 'error', message: 'Tests failed. The pipeline stopped before deploying.' };
    }
    stages[i] = 'done';
    s = pushLog(s, 'info', 'Test: running 12 automated checks…', now);
    s = pushLog(s, 'ok', 'Test: 12 of 12 checks passed (simulated).', now);
    message = 'All checks passed.';
  } else if (id === 'deploy') {
    stages[i] = 'done';
    const history = { ...s.history, [run.target]: [...s.history[run.target], run.version] };
    s = { ...s, history };
    s = pushLog(s, 'ok', `Deploy: ${run.version} released to ${run.target} (simulated).`, now);
    message = `${run.version} released to ${run.target}.`;
  } else if (id === 'monitor') {
    stages[i] = 'done';
    s = pushLog(s, 'ok', `Monitor: health checks for ${run.version} look healthy (simulated).`, now);
    s = { ...s, successes: s.successes + 1, next: s.next + 1, run: { ...run, stages, status: 'success' } };
    return { state: s, level: 'success', message: 'Pipeline finished. Release status is healthy (simulated).' };
  }
  s = { ...s, run: { ...run, stages } };
  return { state: s, level, message };
}

export function rollback(d, env, now = Date.now()) {
  const hist = d.history[env];
  if (hist.length < 2) return { state: d, level: 'warning', message: `${env} has no earlier release to restore.` };
  const from = hist[hist.length - 1];
  const to = hist[hist.length - 2];
  let s = { ...d, history: { ...d.history, [env]: hist.slice(0, -1) }, rollbacks: d.rollbacks + 1, lastRollback: { env, from, to } };
  s = pushLog(s, 'warn', `Rollback: ${env} restored from ${from} to ${to} (simulated).`, now);
  return { state: s, level: 'success', message: `Rolled back ${env} to ${to}.` };
}

export function monitorStats(version, env) {
  let h = 0;
  for (const c of `${version}${env}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    uptime: (99.9 + (h % 10) / 100).toFixed(2),
    latency: 90 + (h % 70),
    errorRate: (((h >> 3) % 12) / 100).toFixed(2),
    requests: 1200 + (h % 800),
  };
}
