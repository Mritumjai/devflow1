import { useEffect, useRef, useState } from 'react';
import { Rocket, Play, StepForward, RotateCcw, Undo2, Loader2, Activity, ServerCog, Cloud } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout } from '../components/InfoCard';
import PipelineStepper from '../components/PipelineStepper';
import CodeBlock from '../components/CodeBlock';
import { useApp } from '../context/AppState';
import { PIPELINE_STAGES, ENVIRONMENTS, MANUAL_VS_AUTO, STATIC_DEPLOY_STEPS, CI_WORKFLOW_SAMPLE } from '../data/deployment';
import { STAGE_IDS, liveVersion, monitorStats } from '../utils/deploySim';
import { clockTime } from '../utils/format';
import { recentCommits } from '../utils/commandSimulator';

const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));

export default function Deployment() {
  const { deploy, deployActions, repo } = useApp();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState('code');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = deploy.run;
  const running = run?.status === 'in-progress';
  const statuses = {};
  STAGE_IDS.forEach((id, i) => {
    const st = run ? run.stages[i] : 'pending';
    statuses[id] = st === 'pending' && running && run.stages.indexOf('pending') === i ? 'active' : st;
  });
  const stage = PIPELINE_STAGES.find((s) => s.id === selected);
  const latest = recentCommits(repo, 1)[0];

  const start = () => deployActions.start(latest ? latest.message : 'Update project files');

  const advanceOnce = async () => {
    setBusy(true);
    await wait(650);
    if (alive.current) deployActions.advance();
    if (alive.current) setBusy(false);
  };

  const runAll = async () => {
    if (!running) {
      const res = deployActions.start(latest ? latest.message : 'Update project files');
      if (res.level === 'warning') return;
    }
    setBusy(true);
    for (let i = 0; i < 4; i += 1) {
      await wait(750);
      if (!alive.current) return;
      const res = deployActions.advance();
      if (res.level === 'error' || res.state.run?.status !== 'in-progress') break;
    }
    if (alive.current) setBusy(false);
  };

  const live = (env) => liveVersion(deploy, env);
  const stats = monitorStats(live(deploy.target), deploy.target);
  const canRollback = deploy.history[deploy.target].length > 1;
  const releases = deploy.history[deploy.target];

  return (
    <>
      <SectionHeading icon={Rocket} title="Deployment and CI/CD">
        Continuous integration and delivery turn a push into a built, tested, released, and monitored application, without anyone copying files by hand.
      </SectionHeading>

      <Callout tone="warning" title="Everything on this page is simulated">
        No build runs, nothing is deployed, and no production system is involved. To really publish this project, follow the static-site steps at the bottom.
      </Callout>

      <InfoCard title="Pipeline" icon={Rocket} actions={<Badge tone="amber">Simulation</Badge>}>
        <PipelineStepper stages={PIPELINE_STAGES} statuses={statuses} selectedId={selected} onSelect={setSelected} label="Code, Build, Test, Deploy, Monitor" />
        <div className="stage-detail" aria-live="polite">
          <strong>{stage.label}: {stage.text}</strong>
          <p>{stage.detail}</p>
        </div>

        <div className="pipeline-controls">
          <label className="field field--inline" htmlFor="target-env">
            Deploy to
            <select id="target-env" className="input" value={deploy.target} onChange={(e) => deployActions.setTarget(e.target.value)} disabled={running}>
              {ENVIRONMENTS.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={deploy.willFail} onChange={(e) => deployActions.setWillFail(e.target.checked)} disabled={running} />
            Make the tests fail on the next run
          </label>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={start} disabled={running || busy}>
            <Play size={16} aria-hidden="true" /> Push to main
          </button>
          <button type="button" className="btn" onClick={advanceOnce} disabled={!running || busy}>
            {busy ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <StepForward size={16} aria-hidden="true" />} Advance one stage
          </button>
          <button type="button" className="btn" onClick={runAll} disabled={busy}>
            Run the whole pipeline
          </button>
        </div>
        {busy && <p className="muted small" role="status">Working on the next stage…</p>}

        {!run && <Callout tone="info" title="No run yet">Click “Push to main” to start. The latest commit message from the simulator is used as the trigger.</Callout>}
        {run?.status === 'in-progress' && <Callout tone="info" title={`Run #${run.id} in progress`}>Advance through each stage, or run them all.</Callout>}
        {run?.status === 'failed' && (
          <Callout tone="error" title={`Run #${run.id} failed at Test`}>
            Automated checks failed, so the deploy was blocked and {live(run.target)} is still live in {run.target}. Turn off “Make the tests fail” and push again to fix it.
          </Callout>
        )}
        {run?.status === 'success' && <Callout tone="success" title={`Run #${run.id} succeeded`}>{run.version} was released to {run.target} (simulated) and its health checks look good.</Callout>}
      </InfoCard>

      <div className="grid grid--2">
        <InfoCard title="Environments" icon={Cloud}>
          <ul className="env-stages">
            {ENVIRONMENTS.map((e) => (
              <li key={e.id} className={deploy.target === e.id ? 'is-target' : ''}>
                <div className="env-stages__head">
                  <strong>{e.label}</strong>
                  <Badge tone={e.id === 'production' ? 'green' : 'blue'}>{live(e.id)}</Badge>
                </div>
                <p>{e.text}</p>
                <small className="muted">Typical source: {e.branch}</small>
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title={`Monitoring: ${deploy.target}`} icon={Activity} actions={<Badge tone="amber">Simulated numbers</Badge>}>
          <p>
            Live release: <strong>{live(deploy.target)}</strong>
            {live(deploy.target) === 'v1.0.0' && <span className="muted"> (baseline)</span>}
          </p>
          <dl className="metrics">
            <div><dt>Uptime</dt><dd>{stats.uptime}%</dd></div>
            <div><dt>Response time</dt><dd>{stats.latency} ms</dd></div>
            <div><dt>Error rate</dt><dd>{stats.errorRate}%</dd></div>
            <div><dt>Requests / min</dt><dd>{stats.requests}</dd></div>
          </dl>
          <h4>Release history</h4>
          <ol className="release-list">
            {[...releases].reverse().map((v, i) => (
              <li key={v + i} className={i === 0 ? 'is-live' : ''}>
                <span className="mono">{v}</span>
                {i === 0 ? <Badge tone="green">live</Badge> : <Badge tone="neutral">previous</Badge>}
              </li>
            ))}
          </ol>
          <button type="button" className="btn" onClick={() => deployActions.rollback(deploy.target)} disabled={!canRollback || running}>
            <Undo2 size={16} aria-hidden="true" /> Roll back {deploy.target}
          </button>
          {!canRollback && <p className="muted small">Only the baseline release exists here, so there is nothing to restore. Run the pipeline first.</p>}
          {deploy.lastRollback && <Callout tone="warning" title="Last rollback">{deploy.lastRollback.env} went from {deploy.lastRollback.from} back to {deploy.lastRollback.to} (simulated).</Callout>}
        </InfoCard>
      </div>

      <InfoCard title="Pipeline log" icon={ServerCog} actions={<button type="button" className="btn btn--ghost btn--sm" onClick={deployActions.reset}><RotateCcw size={14} aria-hidden="true" /> Reset deployment demo</button>}>
        <div className="log" role="log" aria-live="polite" tabIndex={0} aria-label="Pipeline log">
          {deploy.log.map((l) => (
            <div key={l.id} className={`log__line log__line--${l.level}`}>
              <span className="log__time mono">{clockTime(l.time)}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </InfoCard>

      <div className="grid grid--2">
        <InfoCard title="Manual vs automated deployment">
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Manual versus automated deployment</caption>
              <thead>
                <tr><th scope="col">Topic</th><th scope="col">Manual</th><th scope="col">Automated (CI/CD)</th></tr>
              </thead>
              <tbody>
                {MANUAL_VS_AUTO.map((r) => (
                  <tr key={r.label}><th scope="row">{r.label}</th><td>{r.manual}</td><td>{r.auto}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
        <InfoCard title="What CI/CD and rollback mean">
          <p><strong>Continuous integration (CI)</strong> builds and tests every change as soon as it is pushed, so problems appear early.</p>
          <p><strong>Continuous delivery or deployment (CD)</strong> releases the tested build automatically or with one click.</p>
          <p><strong>Rollback</strong> restores the previous working release when a new one misbehaves, usually in minutes.</p>
          <CodeBlock title="The flow" code={`git push origin main\n# CI builds and tests the application\n# A hosting platform such as Render or Vercel deploys it`} />
        </InfoCard>
      </div>

      <InfoCard title="Deploy this project as a static site" icon={Rocket}>
        <p>This app is a static frontend. After <code>npm run build</code>, the <code>dist</code> folder contains everything a host needs. It needs no server and no secrets.</p>
        <CodeBlock title="Static deployment" code={STATIC_DEPLOY_STEPS} />
        <CodeBlock title="Optional CI example" code={CI_WORKFLOW_SAMPLE} />
      </InfoCard>
    </>
  );
}
