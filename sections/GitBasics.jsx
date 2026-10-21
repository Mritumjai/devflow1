import { Terminal, FilePen, ArrowRight, Play, BookOpen, HardDrive, Layers, Database, Cloud } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout } from '../components/InfoCard';
import TerminalSimulator from '../components/TerminalSimulator';
import { useApp } from '../context/AppState';
import { QUICK_COMMANDS, COMMAND_REFERENCE, CONCEPTS, ZONES } from '../data/gitCommands';
import { suggestNext, reachable } from '../utils/commandSimulator';
import { plural } from '../utils/format';

const ZONE_ICONS = { working: HardDrive, staging: Layers, local: Database, remote: Cloud };

export default function GitBasics() {
  const { repo, runGit, runGitAndNotify, editFile, resetRepo } = useApp();
  const b = repo.current;
  const head = b ? repo.branches[b] : null;
  const suggestion = suggestNext(repo);
  const pushedCommits = Math.max(0, ...Object.values(repo.remote).map((id) => reachable(repo, id).size));
  const localCount = repo.order.length;

  const zoneContent = {
    working: repo.working.length ? repo.working : null,
    staging: repo.staged.length ? repo.staged : null,
    local: localCount ? [plural(localCount, 'commit'), head ? `HEAD at ${head}` : ''] : null,
    remote: pushedCommits ? [`${plural(pushedCommits, 'commit')} on origin`, `origin/main ${repo.remote.main || ''}`.trim()] : null,
  };
  const emptyText = {
    working: repo.initialized ? 'Clean: no unsaved changes.' : 'Not a repository yet.',
    staging: 'Nothing staged.',
    local: 'No commits yet.',
    remote: 'Nothing pushed yet.',
  };
  const arrows = ['git add', 'git commit', 'git push'];

  return (
    <>
      <SectionHeading icon={Terminal} title="Git basics">
        Git moves your work through four areas. Run the commands below and watch each area update.
      </SectionHeading>

      <Callout tone="warning" title="This terminal is a simulation">
        It understands a small set of Git commands and changes only the state shown on this page. It never runs real commands or modifies a real repository. Run real Git in your own terminal.
      </Callout>

      <InfoCard title="Where your changes live" icon={Layers}>
        <ol className="zones" aria-label="Git workflow">
          {ZONES.map((z, i) => {
            const Icon = ZONE_ICONS[z.id];
            const content = zoneContent[z.id];
            return (
              <li key={z.id} className="zones__item">
                <div className={`zone ${content ? 'is-filled' : ''}`}>
                  <div className="zone__head">
                    <Icon size={18} aria-hidden="true" />
                    <h4>{z.title}</h4>
                  </div>
                  <p className="zone__text">{z.text}</p>
                  <ul className="zone__content" aria-label={`${z.title} contents`}>
                    {content ? content.filter(Boolean).map((c) => <li key={c} className="mono">{c}</li>) : <li className="muted">{emptyText[z.id]}</li>}
                  </ul>
                </div>
                {i < arrows.length && (
                  <div className="zones__arrow" aria-hidden="true">
                    <code>{arrows[i]}</code>
                    <ArrowRight size={16} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="btn-row">
          <button type="button" className="btn btn--sm" onClick={editFile}>
            <FilePen size={14} aria-hidden="true" /> Edit a file
          </button>
          <span className="muted small">Adds a changed file to the working directory so you have something to stage.</span>
        </div>
      </InfoCard>

      <div className="grid grid--2-1">
        <div className="stack">
          <TerminalSimulator log={repo.log} onRun={runGit} quick={QUICK_COMMANDS} onReset={resetRepo} prompt={`devflow-demo (${b || 'no repo'})`} height={340} emptyText='No commands yet. Start with: git init' />
          <div className="next-step" aria-live="polite">
            <Play size={16} aria-hidden="true" />
            <span>
              <strong>Suggested next step:</strong> {suggestion.why}
            </span>
            {suggestion.cmd && (
              <button type="button" className="btn btn--primary btn--sm" onClick={() => runGit(suggestion.cmd)}>
                Run <code>{suggestion.cmd}</code>
              </button>
            )}
          </div>
        </div>
        <InfoCard title="Command reference" icon={BookOpen}>
          <ul className="reference">
            {COMMAND_REFERENCE.map((c) => (
              <li key={c.cmd}>
                <div className="reference__head">
                  <code>{c.cmd}</code>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => runGitAndNotify(c.cmd, `Ran ${c.cmd}. See the terminal for output.`)} aria-label={`Run ${c.cmd}`}>
                    Run
                  </button>
                </div>
                <p>{c.description}</p>
                <pre className="reference__out" aria-label="Example output">{c.example}</pre>
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      <div className="grid grid--3">
        {CONCEPTS.map((c) => (
          <InfoCard key={c.title} title={c.title}>
            <p>{c.text}</p>
          </InfoCard>
        ))}
        <InfoCard title="Not understood?">
          <p>Unknown commands get an explanation instead of an error you cannot read. Try <code>git rebase</code> or <code>ls</code> and see what happens.</p>
          <Badge tone="blue">Safe by design</Badge>
        </InfoCard>
      </div>
    </>
  );
}
