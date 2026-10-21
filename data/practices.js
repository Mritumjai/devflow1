export const WORKFLOW_STEPS = [
  { id: 'code', label: 'Write code', text: 'Make a small, focused change.', section: 'git-basics' },
  { id: 'commit', label: 'Commit', text: 'Save the change with a clear message.', section: 'git-basics' },
  { id: 'branch', label: 'Branch and merge', text: 'Use a feature branch, then merge it after review.', section: 'branching' },
  { id: 'test', label: 'Test', text: 'Let automated checks confirm nothing broke.', section: 'deployment' },
  { id: 'configure', label: 'Configure environment', text: 'Keep settings and secrets outside the code.', section: 'environment' },
  { id: 'deploy', label: 'Deploy', text: 'Release through the pipeline and monitor the result.', section: 'deployment' },
];

export const PRACTICES = [
  { id: 'small', title: 'Commit regularly with small, meaningful changes', text: 'Small commits are easier to review, understand, and undo.' },
  { id: 'messages', title: 'Write descriptive commit messages', text: 'Say what changed and why. "Add login validation" beats "fix stuff".' },
  { id: 'branches', title: 'Use feature branches for individual tasks', text: 'Unfinished work stays off main, so main always works.' },
  { id: 'review', title: 'Review diffs and pull requests', text: 'A second pair of eyes catches bugs and spreads knowledge.' },
  { id: 'test', title: 'Test before deploying', text: 'Automated tests in CI stop broken code before users see it.' },
  { id: 'secrets', title: 'Protect secrets and keep them out of Git', text: 'Use .gitignore, .env.example, and your hosting platform’s secret store.' },
];

export const TOPIC_SUMMARY = [
  { section: 'version-control', text: 'Version control records changes, restores old versions, and shows who changed what.' },
  { section: 'git-basics', text: 'Git moves changes through four areas: working directory, staging, local repository, remote.' },
  { section: 'branching', text: 'Branches isolate work so main stays stable.' },
  { section: 'merging', text: 'Merges combine branches. Conflicts need a human decision.' },
  { section: 'deployment', text: 'CI/CD builds, tests, and deploys automatically, and can roll back.' },
  { section: 'environment', text: 'Configuration lives in environment variables, never in committed secrets.' },
];
