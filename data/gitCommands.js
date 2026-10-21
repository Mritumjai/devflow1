/** Command reference shown in the Git basics section. */
export const QUICK_COMMANDS = [
  'git init',
  'git status',
  'git add .',
  'git commit -m "Initial commit"',
  'git push',
  'git push origin main',
];

export const COMMAND_REFERENCE = [
  {
    cmd: 'git init',
    description: 'Creates a new, empty repository in the current folder.',
    example: 'Initialized empty Git repository in /devflow-demo/.git/',
  },
  {
    cmd: 'git status',
    description: 'Shows which files are changed, staged, or untracked.',
    example: 'On branch main\nUntracked files:\n        index.html',
  },
  {
    cmd: 'git add .',
    description: 'Moves every change from the working directory to the staging area.',
    example: '(no output in real Git)',
  },
  {
    cmd: 'git commit -m "Initial commit"',
    description: 'Saves the staged snapshot to the local repository.',
    example: '[main (root-commit) d333808] Initial commit',
  },
  {
    cmd: 'git push',
    description: 'Publishes local commits to the remote. Fails until the branch has an upstream.',
    example: 'fatal: The current branch main has no upstream branch.',
  },
  {
    cmd: 'git push origin main',
    description: 'Publishes the main branch to the remote named origin.',
    example: 'To https://github.com/your-name/devflow-demo.git\n * [new branch]      main -> main',
  },
  {
    cmd: 'git log --oneline',
    description: 'Lists commits, newest first, one per line.',
    example: 'd333808 (HEAD -> main) Initial commit',
  },
  {
    cmd: 'git branch',
    description: 'Lists branches. The current one is marked with *.',
    example: '* main\n  feature-login',
  },
  {
    cmd: 'git switch -c feature-login',
    description: 'Creates a branch and switches to it.',
    example: "Switched to a new branch 'feature-login'",
  },
  {
    cmd: 'git switch main',
    description: 'Moves back to the main branch.',
    example: "Switched to branch 'main'",
  },
  {
    cmd: 'git merge feature-login',
    description: 'Brings the commits of feature-login into the current branch.',
    example: 'Updating d333808..62c1a10\nFast-forward',
  },
];

export const CONCEPTS = [
  {
    title: 'Distributed system',
    text: 'Every developer has a full copy of the project and its history. No single server is needed for day-to-day work.',
  },
  {
    title: 'Repository',
    text: 'The project folder plus the hidden history Git keeps in .git: every commit, branch, and tag.',
  },
  {
    title: 'Commit',
    text: 'A saved snapshot with an author, a time, and a message that explains why the change was made.',
  },
  {
    title: 'Remote',
    text: 'A shared copy of the repository on a service like GitHub or GitLab. You push to it and pull from it.',
  },
  {
    title: 'Offline-friendly workflow',
    text: 'Status, add, commit, branch, and log all work without a network. You only need a connection to push or pull.',
  },
];

export const ZONES = [
  {
    id: 'working',
    title: 'Working directory',
    text: 'The files you are editing right now.',
  },
  {
    id: 'staging',
    title: 'Staging area',
    text: 'Changes you have chosen to include in the next commit.',
  },
  {
    id: 'local',
    title: 'Local repository',
    text: 'Saved commit history on your own computer.',
  },
  {
    id: 'remote',
    title: 'Remote repository',
    text: 'A shared repository on GitHub or GitLab.',
  },
];
