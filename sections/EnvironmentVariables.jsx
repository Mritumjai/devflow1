import { ShieldCheck, Check, FileLock2 } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import InfoCard, { Badge, Callout } from '../components/InfoCard';
import CodeBlock from '../components/CodeBlock';
import EnvironmentPlayground from '../components/EnvironmentPlayground';
import { useApp } from '../context/AppState';
import { ENV_EXAMPLE_FILE, GITIGNORE_FILE, NODE_EXAMPLE, VITE_EXAMPLE, SECURITY_CHECKLIST } from '../data/demoEnv';

export default function EnvironmentVariables() {
  const { envChecks, toggleEnvCheck } = useApp();
  const done = SECURITY_CHECKLIST.filter((i) => envChecks[i.id]).length;
  const complete = done === SECURITY_CHECKLIST.length;

  return (
    <>
      <SectionHeading icon={ShieldCheck} title="Environment variables and security">
        Configuration changes between laptops, test servers, and production. Keeping it outside your code lets one codebase run everywhere, and keeps secrets out of Git.
      </SectionHeading>

      <Callout tone="info" title="Placeholders only">
        Every value on this page is fake. This project contains no real credentials.
      </Callout>

      <EnvironmentPlayground />

      <div className="grid grid--2">
        <InfoCard title="Using variables in Node.js" icon={FileLock2}>
          <CodeBlock title="server.js" code={NODE_EXAMPLE} />
          <p>
            Node.js apps commonly load a <code>.env</code> file with the <code>dotenv</code> package, or with Node’s built-in support for environment files in recent versions. Either way the values end up on <code>process.env</code>.
          </p>
        </InfoCard>
        <InfoCard title="Using variables in Vite" icon={FileLock2}>
          <CodeBlock title="src/main.jsx" code={VITE_EXAMPLE} />
          <p>
            Vite exposes only variables whose names start with <code>VITE_</code> to browser code, through <code>import.meta.env</code>.
          </p>
          <Callout tone="error" title="Browser code is public">
            Never put a real <code>DATABASE_URL</code>, private API key, or backend secret in a <code>VITE_</code> variable. Anything shipped to the browser can be read by anyone.
          </Callout>
        </InfoCard>
      </div>

      <div className="grid grid--2">
        <InfoCard title="What each setting is for" icon={ShieldCheck}>
          <dl className="facts facts--stacked">
            <div><dt>Database connection strings</dt><dd>Tell the app where its data lives and how to log in. Server only.</dd></div>
            <div><dt>API URLs and API keys</dt><dd>URLs are often public. Keys prove identity and must be protected.</dd></div>
            <div><dt>Application ports</dt><dd>The port a server listens on. Hosts usually assign it.</dd></div>
            <div><dt>Development vs production</dt><dd>NODE_ENV switches debugging help and optimisations on or off.</dd></div>
          </dl>
        </InfoCard>
        <InfoCard title="Files that keep secrets safe" icon={ShieldCheck}>
          <CodeBlock title=".env.example (commit this)" code={ENV_EXAMPLE_FILE} />
          <CodeBlock title=".gitignore (commit this)" code={GITIGNORE_FILE} />
        </InfoCard>
      </div>

      <InfoCard title="Security checklist" icon={Check} actions={<Badge tone={complete ? 'green' : 'amber'}>{done} of {SECURITY_CHECKLIST.length} checked</Badge>}>
        <ul className="checklist">
          {SECURITY_CHECKLIST.map((item) => (
            <li key={item.id}>
              <label className={`check check--block ${envChecks[item.id] ? 'is-checked' : ''}`}>
                <input type="checkbox" checked={Boolean(envChecks[item.id])} onChange={() => toggleEnvCheck(item.id)} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {complete ? (
          <Callout tone="success" title="Checklist complete">Your secrets habits are in good shape.</Callout>
        ) : (
          <Callout tone="warning" title="Not finished">
            Tick each item once you understand it.
          </Callout>
        )}
      </InfoCard>
    </>
  );
}
