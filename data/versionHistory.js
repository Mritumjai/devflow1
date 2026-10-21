/** Static example data for the Version control section. */
export const VERSION_HISTORY = [
  {
    id: 'a1f3c9e',
    message: 'Add homepage',
    author: 'Asha',
    timeLabel: 'Mon 09:12',
    file: 'index.html',
    why: 'The site had no landing page yet, so visitors saw an empty screen.',
    diff: [
      { type: 'ctx', text: '<body>' },
      { type: 'add', text: '  <h1>Welcome to DevFlow</h1>' },
      { type: 'add', text: '  <p>Learn Git by doing.</p>' },
      { type: 'ctx', text: '</body>' },
    ],
  },
  {
    id: '7be42d1',
    message: 'Fix navbar',
    author: 'Ravi',
    timeLabel: 'Mon 11:40',
    file: 'navbar.css',
    why: 'Menu links overlapped the logo on narrow phone screens.',
    diff: [
      { type: 'ctx', text: '.navbar {' },
      { type: 'del', text: '  display: block;' },
      { type: 'add', text: '  display: flex;' },
      { type: 'add', text: '  flex-wrap: wrap;' },
      { type: 'ctx', text: '}' },
    ],
  },
  {
    id: 'c90d5a8',
    message: 'Add login',
    author: 'Asha',
    timeLabel: 'Tue 10:05',
    file: 'login.html',
    why: 'Users need an account page before we can build saved progress.',
    diff: [
      { type: 'add', text: '<form class="login">' },
      { type: 'add', text: '  <input type="email" required />' },
      { type: 'add', text: '  <button>Log in</button>' },
      { type: 'add', text: '</form>' },
    ],
  },
  {
    id: '3fe8b27',
    message: 'Update styles',
    author: 'Meena',
    timeLabel: 'Tue 15:30',
    file: 'styles.css',
    why: 'Text contrast was too low; the new colours pass accessibility checks.',
    diff: [
      { type: 'ctx', text: 'body {' },
      { type: 'del', text: '  color: #999;' },
      { type: 'add', text: '  color: #1f2937;' },
      { type: 'ctx', text: '}' },
    ],
  },
];

export const BENEFITS = [
  { id: 'collaboration', title: 'Collaboration', text: 'Many people can work on the same project at the same time and combine their changes.' },
  { id: 'recovery', title: 'Recovery', text: 'Any earlier version can be restored if a change breaks something.' },
  { id: 'accountability', title: 'Accountability', text: 'Every change records who made it, when, and why.' },
  { id: 'tracking', title: 'Change tracking', text: 'A diff shows exactly which lines were added, removed, or edited between two versions.' },
];

export const COMPARISON_ROWS = [
  { label: 'Where history lives', central: 'On one central server', distributed: 'In every clone, plus the shared remote' },
  { label: 'Working offline', central: 'Limited: commits need the server', distributed: 'Full: commit, branch, and browse history offline' },
  { label: 'If the server fails', central: 'Single point of failure', distributed: 'Any clone can restore the project' },
  { label: 'Branching', central: 'Possible, but heavier and slower', distributed: 'Cheap and fast; encouraged for every task' },
  { label: 'Examples', central: 'SVN, CVS', distributed: 'Git' },
];

export const TEAM = ['Alice', 'Bob', 'Chen'];
