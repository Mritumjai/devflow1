/** Placeholder-only environment data. No real credentials exist anywhere in this project. */
export const ENV_VARS = [
  {
    key: 'PORT',
    value: '3000',
    kind: 'Application port',
    scope: 'server',
    text: 'The network port the server listens on. Hosting platforms often set this for you.',
  },
  {
    key: 'DATABASE_URL',
    value: 'your_database_url',
    kind: 'Database connection string',
    scope: 'server',
    text: 'Where and how the app connects to its database. A real one contains a password, so it must stay on the server.',
  },
  {
    key: 'API_KEY',
    value: 'your_api_key',
    kind: 'API key',
    scope: 'server',
    text: 'Proves to a third-party API that requests come from you. Treat real keys like passwords.',
  },
  {
    key: 'NODE_ENV',
    value: 'development',
    kind: 'Mode',
    scope: 'server',
    text: 'Switches behaviour between development (detailed errors, hot reload) and production (optimised, quieter).',
  },
];

export const ENV_EXAMPLE_FILE = `# .env.example — safe to commit: placeholders only
PORT=3000
DATABASE_URL=
API_KEY=
NODE_ENV=development`;

export const GITIGNORE_FILE = `# dependencies
node_modules/

# build output
dist/

# local environment files
.env
.env.*
!.env.example`;

export const NODE_EXAMPLE = `require("dotenv").config();
const port = process.env.PORT || 3000;
app.listen(port);`;

export const VITE_EXAMPLE = `// Only VITE_-prefixed variables reach browser code
const appName = import.meta.env.VITE_APP_NAME;`;

export const SECURITY_CHECKLIST = [
  { id: 'no-secrets', label: 'Never commit real API keys or secrets', detail: 'Once a secret is in Git history, assume it is leaked. Rotate it, do not just delete the file.' },
  { id: 'gitignore', label: 'Add .env to .gitignore', detail: 'Do this before the first commit. Ignoring a file does not remove it if it was already committed.' },
  { id: 'platform', label: 'Configure production secrets on the hosting platform', detail: 'Vercel, Render, and similar platforms store variables encrypted and inject them at runtime.' },
  { id: 'example', label: 'Share a safe .env.example with fake or empty values', detail: 'Teammates copy it to .env and fill in their own values.' },
];

export const GITIGNORE_SAMPLES = ['.env', '.env.local', '.env.example', 'node_modules/react/index.js', 'dist/index.html', 'src/App.jsx'];
export const VITE_SAMPLES = ['VITE_APP_NAME', 'VITE_API_KEY', 'DATABASE_URL', 'PORT'];
