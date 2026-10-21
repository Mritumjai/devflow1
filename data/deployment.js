import { Code, Hammer, FlaskConical, Rocket, Activity, GitCommitHorizontal, Cloud, Globe } from 'lucide-react';

export const PIPELINE_STAGES = [
  { id: 'code', label: 'Code', icon: Code, text: 'Write a change, commit it, and push it to the main branch.', detail: 'A push to main is the trigger. Nothing is built yet; the change is only stored in the shared repository.' },
  { id: 'build', label: 'Build', icon: Hammer, text: 'Compile or bundle the application.', detail: 'The CI server installs dependencies and runs the build (for this project, vite build) to produce the files that will be served.' },
  { id: 'test', label: 'Test', icon: FlaskConical, text: 'Validate that features still work.', detail: 'Automated checks run on every change. If any fail, the pipeline stops and nothing is deployed.' },
  { id: 'deploy', label: 'Deploy', icon: Rocket, text: 'Release the application.', detail: 'The hosting platform (for example Vercel or Render) publishes the new build to the chosen environment.' },
  { id: 'monitor', label: 'Monitor', icon: Activity, text: 'Watch uptime, logs, and runtime behaviour.', detail: 'Health checks, logs, and error rates show whether the release is healthy, and whether to roll back.' },
];

export const DASHBOARD_STAGES = [
  { id: 'code', label: 'Code', icon: Code, text: 'Edit files and commit them.' },
  { id: 'git', label: 'Git', icon: GitCommitHorizontal, text: 'Push the commits to the shared remote.' },
  { id: 'cloud', label: 'Cloud', icon: Cloud, text: 'CI builds, tests, and deploys the push.' },
  { id: 'live', label: 'Live', icon: Globe, text: 'Users get the new release in production.' },
];

export const ENVIRONMENTS = [
  { id: 'development', label: 'Development', text: 'Where developers run and try changes. Breaking things here is normal.', branch: 'feature branches' },
  { id: 'staging', label: 'Testing / Staging', text: 'A production-like copy used for final checks before release.', branch: 'main (after review)' },
  { id: 'production', label: 'Production', text: 'The live application that real users see. It must stay stable.', branch: 'main (after tests pass)' },
];

export const MANUAL_VS_AUTO = [
  { label: 'How a release happens', manual: 'Someone copies files to a server by hand', auto: 'A push triggers build, test, and deploy' },
  { label: 'Consistency', manual: 'Steps differ between people and days', auto: 'The same scripted steps every time' },
  { label: 'Speed of feedback', manual: 'Problems found late, often by users', auto: 'Failures show within minutes' },
  { label: 'Risk of human error', manual: 'High: forgotten files, wrong settings', auto: 'Low: repeatable and logged' },
  { label: 'Undoing a bad release', manual: 'Slow and stressful', auto: 'Redeploy or roll back the previous release' },
];

export const STATIC_DEPLOY_STEPS = `# 1. Build the static site
npm run build          # creates the dist/ folder

# 2. Preview the production build locally
npm run preview

# 3. Deploy with Vercel (dashboard flow)
#    - Push the project to GitHub
#    - In Vercel choose "Add New Project" and import the repository
#    - Framework preset: Vite   Build command: npm run build   Output: dist
#    - Click Deploy`;

export const CI_WORKFLOW_SAMPLE = `# .github/workflows/ci.yml  (optional example)
name: CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build`;
