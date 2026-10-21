/**
 * DevFlow command simulator.
 *
 * Everything here is a pure function over a plain JSON "repository" object.
 * Nothing touches a real Git repository, the file system, or a shell.
 * Unsupported input is rejected with an explanation, never executed.
 */

export const SCHEMA = 2;
export const DEMO_USER = 'Asha';
export const REMOTE_URL = 'https://github.com/your-name/devflow-demo.git';

const FILE_POOL = ['index.html', 'login.js', 'styles.css', 'README.md', 'navbar.css', 'auth.js'];
const MAIN_MESSAGES = [
  'Update README',
  'Fix navbar spacing',
  'Refine homepage copy',
  'Add footer links',
  'Tidy stylesheet',
];
const FEATURE_MESSAGES = [
  'Add login form',
  'Add login validation',
  'Style the login page',
  'Show login errors',
  'Add remember-me option',
];

export const defaultStats = () => ({ merges: 0, ff: 0, threeWay: 0, conflicts: 0 });

export function createRepo() {
  return {
    v: SCHEMA,
    initialized: false,
    current: null,
    working: ['index.html', 'login.js', 'styles.css'],
    staged: [],
    tracked: [],
    commits: {},
    order: [],
    branches: {},
    upstream: {},
    remote: {},
    seq: 0,
    log: [],
    logSeq: 0,
    merging: null,
    resolution: null,
    stats: defaultStats(),
    lastOutcome: null,
  };
}

export const isValidSim = (s) => Boolean(s) && s.v === SCHEMA && typeof s.commits === 'object';

/* ---------- small helpers ---------- */

const line = (t, text) => ({ t, text });
const out = (text) => line('out', text);
const err = (text) => line('err', text);
const ok = (text) => line('ok', text);
const warn = (text) => line('warn', text);
const hint = (text) => line('hint', `# ${text}`);
const result = (state, output) => ({ state, output });

export function hashHex(seed) {
  let hex = '';
  let h = 2166136261;
  for (let i = 0; i < 5; i += 1) {
    for (const c of `${seed}|${i}`) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    hex += h.toString(16).padStart(8, '0');
  }
  return hex;
}

export const fullHash = (id) => (id + hashHex(id)).slice(0, 40);

export function addCommit(state, { message, parents, branch, files = [], touches = [], author = DEMO_USER, time = Date.now() }) {
  const seq = state.seq + 1;
  const id = hashHex(`${seq}|${message}|${branch}`).slice(0, 7);
  const commit = { id, message, author, time, parents, branch, files, touches, seq };
  return {
    ...state,
    seq,
    commits: { ...state.commits, [id]: commit },
    order: [...state.order, id],
  };
}

export function reachable(state, id) {
  const seen = new Set();
  const stack = id ? [id] : [];
  while (stack.length) {
    const c = stack.pop();
    if (seen.has(c) || !state.commits[c]) continue;
    seen.add(c);
    stack.push(...state.commits[c].parents);
  }
  return seen;
}

const bySeqDesc = (state) => (a, b) => state.commits[b].seq - state.commits[a].seq;

export function branchLog(state, branch) {
  const head = state.branches[branch];
  return [...reachable(state, head)].sort(bySeqDesc(state)).map((id) => state.commits[id]);
}

export function recentCommits(state, n = 6) {
  return [...state.order].reverse().slice(0, n).map((id) => state.commits[id]);
}

export function unpushedCount(state, branch) {
  const head = state.branches[branch];
  if (!head) return 0;
  const pushed = reachable(state, state.remote[branch]);
  return [...reachable(state, head)].filter((id) => !pushed.has(id)).length;
}

export function appendLog(state, entries) {
  let seq = state.logSeq || 0;
  const added = entries.map((e) => ({ id: ++seq, cmd: e.cmd, output: e.output }));
  return { ...state, logSeq: seq, log: [...state.log, ...added].slice(-80) };
}

const bump = (stats, key) => {
  const s = stats || defaultStats();
  return { ...s, merges: s.merges + 1, [key]: (s[key] || 0) + 1 };
};

function tokenize(input) {
  const tokens = [];
  let cur = '';
  let quote = null;
  let had = false;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      had = true;
    } else if (/\s/.test(ch)) {
      if (cur || had) {
        tokens.push(cur);
        cur = '';
        had = false;
      }
    } else {
      cur += ch;
    }
  }
  if (quote) return { error: 'unterminated quote — close your quotation marks' };
  if (cur || had) tokens.push(cur);
  return { tokens };
}

const notRepo = (state) =>
  result(state, [
    err('fatal: not a git repository (or any of the parent directories): .git'),
    hint('Run git init first.'),
  ]);

const unsupportedFlag = (state, flag, cmd) =>
  result(state, [
    err(`error: option '${flag}' is not supported by the simulator for git ${cmd}.`),
    hint('See the command reference for what is available.'),
  ]);

const validBranchName = (n) => /^[A-Za-z0-9._/-]+$/.test(n) && !n.startsWith('-');

/* ---------- command handlers ---------- */

function helpLines() {
  return [
    out('DevFlow simulated terminal — supported commands:'),
    out('  git init                      create a repository'),
    out('  git status                    show working directory and staging area'),
    out('  git add . | <file>            stage changes'),
    out('  git commit -m "message"       save staged changes'),
    out('  git log [--oneline]           show history'),
    out('  git branch [name] [-d name]   list, create, or delete branches'),
    out('  git switch [-c] <name>        change or create a branch'),
    out('  git merge <name>              merge a branch into the current one'),
    out('  git push [origin <branch>]    publish commits to the simulated remote'),
    out('  git remote -v                 show the simulated remote'),
    out('  clear                         clear this screen'),
    hint('This is a simulation. No real Git repository or file is ever changed.'),
  ];
}

function gitInit(state) {
  if (state.initialized) {
    return result(state, [out('Reinitialized existing Git repository in /devflow-demo/.git/')]);
  }
  return result({ ...state, initialized: true, current: 'main', branches: { main: null } }, [
    out('Initialized empty Git repository in /devflow-demo/.git/'),
    hint('Default branch is main. Your files are untracked until you run git add.'),
  ]);
}

function gitStatus(state) {
  if (!state.initialized) return notRepo(state);
  const b = state.current;
  const lines = [out(`On branch ${b}`)];
  const head = state.branches[b];
  if (!head) {
    lines.push(out(''), out('No commits yet'));
  } else if (state.upstream[b]) {
    const ahead = unpushedCount(state, b);
    lines.push(
      out(
        ahead
          ? `Your branch is ahead of 'origin/${b}' by ${ahead} commit${ahead > 1 ? 's' : ''}.`
          : `Your branch is up to date with 'origin/${b}'.`,
      ),
    );
    if (ahead) lines.push(out('  (use "git push" to publish your local commits)'));
  }
  const modified = state.working.filter((f) => state.tracked.includes(f));
  const untracked = state.working.filter((f) => !state.tracked.includes(f));
  if (state.staged.length) {
    lines.push(out(''), out('Changes to be committed:'));
    state.staged.forEach((f) =>
      lines.push(ok(`        ${state.tracked.includes(f) ? 'modified:   ' : 'new file:   '}${f}`)),
    );
  }
  if (modified.length) {
    lines.push(out(''), out('Changes not staged for commit:'), out('  (use "git add <file>..." to update what will be committed)'));
    modified.forEach((f) => lines.push(warn(`        modified:   ${f}`)));
  }
  if (untracked.length) {
    lines.push(out(''), out('Untracked files:'), out('  (use "git add <file>..." to include in what will be committed)'));
    untracked.forEach((f) => lines.push(warn(`        ${f}`)));
  }
  lines.push(out(''));
  if (!state.staged.length && !state.working.length) lines.push(out('nothing to commit, working tree clean'));
  else if (!state.staged.length && !modified.length) lines.push(out('nothing added to commit but untracked files present (use "git add" to track)'));
  else if (!state.staged.length) lines.push(out('no changes added to commit (use "git add" and/or "git commit -a")'));
  return result(state, lines);
}

function gitAdd(state, args) {
  if (!state.initialized) return notRepo(state);
  if (!args.length) {
    return result(state, [out('Nothing specified, nothing added.'), hint("Maybe you wanted to say 'git add .'?")]);
  }
  const all = args.some((a) => ['.', '-A', '--all'].includes(a));
  let names = [];
  if (all) {
    names = [...state.working];
  } else {
    for (const a of args) {
      if (a.startsWith('-')) return unsupportedFlag(state, a, 'add');
      if (state.staged.includes(a)) continue;
      if (!state.working.includes(a)) return result(state, [err(`fatal: pathspec '${a}' did not match any files`)]);
      names.push(a);
    }
  }
  if (!names.length) {
    return result(state, [hint('Nothing new to stage. Use "Edit a file" to simulate a change in the working directory.')]);
  }
  const next = {
    ...state,
    working: state.working.filter((f) => !names.includes(f)),
    staged: [...new Set([...state.staged, ...names])],
  };
  return result(next, [hint(`staged ${names.length} file${names.length > 1 ? 's' : ''}: ${names.join(', ')}`)]);
}

function gitCommit(state, args, now) {
  if (!state.initialized) return notRepo(state);
  let msg = null;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '-m' || a === '--message') {
      msg = args[i + 1];
      if (msg === undefined) return result(state, [err("error: switch `m' requires a value")]);
      i += 1;
    } else if (a.startsWith('--message=')) {
      msg = a.slice(10);
    } else if (a === '-a' || a === '-am') {
      return result(state, [err(`error: '${a}' is not supported in the simulator.`), hint('Stage with git add . and then run git commit -m "message".')]);
    } else {
      return result(state, [err(`error: unknown option '${a}'`)]);
    }
  }
  if (msg === null) {
    return result(state, [err('Aborting commit: the simulator needs a message.'), hint('Use git commit -m "Describe your change".')]);
  }
  if (!msg.trim()) return result(state, [err('Aborting commit due to empty commit message.')]);
  if (!state.staged.length) {
    return result(state, [
      out(`On branch ${state.current}`),
      out(state.working.length ? 'no changes added to commit (use "git add" and/or "git commit -a")' : 'nothing to commit, working tree clean'),
      hint(state.working.length ? 'Stage your changes first: git add .' : 'Use "Edit a file" to simulate a change.'),
    ]);
  }
  const b = state.current;
  const parent = state.branches[b];
  const files = state.staged;
  const withCommit = addCommit(state, {
    message: msg.trim(),
    parents: parent ? [parent] : [],
    branch: b,
    files,
    touches: files,
    time: now,
  });
  const id = withCommit.order[withCommit.order.length - 1];
  const next = {
    ...withCommit,
    branches: { ...withCommit.branches, [b]: id },
    tracked: [...new Set([...state.tracked, ...files])],
    staged: [],
  };
  return result(next, [
    out(`[${b}${parent ? '' : ' (root-commit)'} ${id}] ${msg.trim()}`),
    out(` ${files.length} file${files.length > 1 ? 's' : ''} changed`),
  ]);
}

function decorations(state, id) {
  const refs = [];
  const head = state.branches[state.current];
  if (head === id) refs.push(`HEAD -> ${state.current}`);
  Object.keys(state.branches)
    .filter((n) => state.branches[n] === id && !(head === id && n === state.current))
    .forEach((n) => refs.push(n));
  Object.keys(state.remote)
    .filter((b) => state.remote[b] === id)
    .forEach((b) => refs.push(`origin/${b}`));
  return refs.length ? ` (${refs.join(', ')})` : '';
}

function gitLog(state, args) {
  if (!state.initialized) return notRepo(state);
  const head = state.branches[state.current];
  if (!head) return result(state, [err(`fatal: your current branch '${state.current}' does not have any commits yet`)]);
  const oneline = args.includes('--oneline');
  const lines = [];
  branchLog(state, state.current).forEach((c) => {
    const deco = decorations(state, c.id);
    if (oneline) {
      lines.push(out(`${c.id}${deco} ${c.message}`));
    } else {
      lines.push(out(`commit ${fullHash(c.id)}${deco}`));
      if (c.parents.length > 1) lines.push(out(`Merge: ${c.parents.join(' ')}`));
      lines.push(out(`Author: ${c.author} <${c.author.toLowerCase()}@example.com>`));
      lines.push(out(`Date:   ${new Date(c.time).toUTCString()}`), out(''), out(`    ${c.message}`), out(''));
    }
  });
  return result(state, lines);
}

function gitBranch(state, args) {
  if (!state.initialized) return notRepo(state);
  const flags = args.filter((a) => a.startsWith('-'));
  const names = args.filter((a) => !a.startsWith('-'));
  const force = flags.includes('-D');
  const del = force || flags.includes('-d') || flags.includes('--delete');

  if (del) {
    if (!names.length) return result(state, [err('fatal: branch name required')]);
    let st = state;
    const lines = [];
    names.forEach((n) => {
      if (!(n in st.branches)) return lines.push(err(`error: branch '${n}' not found.`));
      if (n === 'main') return lines.push(err("error: this simulator keeps 'main' so the demo stays consistent."));
      if (n === st.current) {
        lines.push(err(`error: Cannot delete branch '${n}' checked out at '/devflow-demo'`), hint('Switch away first: git switch main'));
        return null;
      }
      const tip = st.branches[n];
      const curHead = st.branches[st.current];
      if (!force && tip && !reachable(st, curHead).has(tip)) {
        lines.push(err(`error: The branch '${n}' is not fully merged.`), out(`If you are sure you want to delete it, run 'git branch -D ${n}'.`));
        return null;
      }
      const rest = { ...st.branches };
      delete rest[n];
      st = { ...st, branches: rest };
      lines.push(out(`Deleted branch ${n} (was ${tip || '0000000'}).`));
      return null;
    });
    return result(st, lines);
  }
  if (flags.length) return unsupportedFlag(state, flags[0], 'branch');

  if (!names.length) {
    const list = Object.keys(state.branches).filter((b) => state.branches[b]);
    if (!list.length) return result(state, [hint('No branches yet. Make a first commit and main will appear.')]);
    list.sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : a.localeCompare(b)));
    return result(state, list.map((b) => (b === state.current ? ok(`* ${b}`) : out(`  ${b}`))));
  }
  const name = names[0];
  if (!validBranchName(name)) return result(state, [err(`fatal: '${name}' is not a valid branch name`)]);
  if (name in state.branches) return result(state, [err(`fatal: a branch named '${name}' already exists`)]);
  const head = state.branches[state.current];
  if (!head) return result(state, [err(`fatal: not a valid object name: '${state.current}'`), hint('Make a first commit before creating branches.')]);
  return result({ ...state, branches: { ...state.branches, [name]: head } }, [hint(`created ${name} at ${head}; you are still on ${state.current}`)]);
}

function gitSwitch(state, args) {
  if (!state.initialized) return notRepo(state);
  let create = false;
  const rest = [];
  for (const a of args) {
    if (a === '-c' || a === '--create' || a === '-b') create = true;
    else if (a.startsWith('-')) return unsupportedFlag(state, a, 'switch');
    else rest.push(a);
  }
  const name = rest[0];
  if (!name) return result(state, [err('fatal: missing branch name')]);
  if (create) {
    if (!validBranchName(name)) return result(state, [err(`fatal: '${name}' is not a valid branch name`)]);
    if (name in state.branches) return result(state, [err(`fatal: a branch named '${name}' already exists`)]);
    const head = state.branches[state.current];
    if (!head) {
      return result(state, [err('fatal: make a first commit before creating a branch.'), hint('Run git add . and git commit -m "Initial commit" first.')]);
    }
    return result({ ...state, branches: { ...state.branches, [name]: head }, current: name }, [out(`Switched to a new branch '${name}'`)]);
  }
  if (!(name in state.branches)) {
    return result(state, [err(`fatal: invalid reference: ${name}`), hint(`Create it with: git switch -c ${name}`)]);
  }
  if (name === state.current) return result(state, [out(`Already on '${name}'`)]);
  return result({ ...state, current: name }, [out(`Switched to branch '${name}'`)]);
}

export function doMerge(state, name, { detectConflicts = false, now = Date.now() } = {}) {
  const cur = state.current;
  const curHead = state.branches[cur];
  if (name === cur) return { state, output: [out('Already up to date.')], type: 'noop' };
  if (!(name in state.branches) || !state.branches[name]) {
    return { state, output: [err(`merge: ${name} - not something we can merge`)], type: 'error' };
  }
  const target = state.branches[name];
  if (!curHead) return { state, output: [err('fatal: you need a commit on the current branch before merging.')], type: 'error' };
  const curReach = reachable(state, curHead);
  if (curReach.has(target)) return { state, output: [out('Already up to date.')], type: 'noop' };
  const tReach = reachable(state, target);

  if (tReach.has(curHead)) {
    const n = [...tReach].filter((id) => !curReach.has(id)).length;
    return {
      state: { ...state, branches: { ...state.branches, [cur]: target }, stats: bump(state.stats, 'ff') },
      output: [
        out(`Updating ${curHead}..${target}`),
        out('Fast-forward'),
        out(` ${n} commit${n > 1 ? 's' : ''} brought into ${cur}`),
        hint(`${cur} only moved forward to ${target}. No merge commit is needed.`),
      ],
      type: 'fast-forward',
    };
  }

  const mine = [...curReach].filter((id) => !tReach.has(id)).map((id) => state.commits[id]);
  const theirs = [...tReach].filter((id) => !curReach.has(id)).map((id) => state.commits[id]);
  if (detectConflicts) {
    const mineFiles = new Set(mine.flatMap((c) => c.touches));
    const shared = [...new Set(theirs.flatMap((c) => c.touches))].filter((f) => mineFiles.has(f));
    if (shared.length) {
      return {
        state,
        output: [
          out(`Auto-merging ${shared[0]}`),
          err(`CONFLICT (content): Merge conflict in ${shared[0]}`),
          err('Automatic merge failed; fix conflicts and then commit the result.'),
        ],
        type: 'conflict',
        file: shared[0],
      };
    }
  }
  const withCommit = addCommit(state, {
    message: `Merge branch '${name}' into ${cur}`,
    parents: [curHead, target],
    branch: cur,
    touches: [...new Set(theirs.flatMap((c) => c.touches))],
    time: now,
  });
  const id = withCommit.order[withCommit.order.length - 1];
  return {
    state: { ...withCommit, branches: { ...withCommit.branches, [cur]: id }, stats: bump(state.stats, 'threeWay') },
    output: [
      out("Merge made by the 'ort' strategy."),
      out(` ${theirs.length} commit${theirs.length > 1 ? 's' : ''} from ${name} combined with ${mine.length} from ${cur}`),
      hint(`New merge commit ${id} has two parents: ${curHead} and ${target}.`),
    ],
    type: 'three-way',
  };
}

function gitMerge(state, args, now) {
  if (!state.initialized) return notRepo(state);
  if (args.includes('--abort')) return result(state, [err('fatal: There is no merge to abort (MERGE_HEAD missing).')]);
  const flag = args.find((a) => a.startsWith('-'));
  if (flag) return unsupportedFlag(state, flag, 'merge');
  const name = args[0];
  if (!name) return result(state, [err('fatal: specify a branch to merge, for example: git merge feature-login')]);
  const r = doMerge(state, name, { now });
  return result(r.state, r.output);
}

function gitPush(state, args) {
  if (!state.initialized) return notRepo(state);
  const flags = args.filter((a) => a.startsWith('-'));
  const bad = flags.find((f) => !['-u', '--set-upstream'].includes(f));
  if (bad) return unsupportedFlag(state, bad, 'push');
  const pos = args.filter((a) => !a.startsWith('-'));
  const [remoteName, branchArg] = pos;
  const b = branchArg || state.current;

  if (!remoteName && !state.upstream[b] && !flags.length) {
    if (!state.branches[b]) return result(state, [err(`error: src refspec ${b} does not match any`), err("error: failed to push some refs to 'origin'")]);
    return result(state, [
      err(`fatal: The current branch ${b} has no upstream branch.`),
      out('To push the current branch and set the remote as upstream, use'),
      out(''),
      out(`    git push --set-upstream origin ${b}`),
      hint(`In this simulator you can also run: git push origin ${b}`),
    ]);
  }
  if (remoteName && remoteName !== 'origin') {
    return result(state, [err(`fatal: '${remoteName}' does not appear to be a git repository`), hint("This demo has one remote, named origin.")]);
  }
  const tip = state.branches[b];
  if (!tip) {
    return result(state, [err(`error: src refspec ${b} does not match any`), err("error: failed to push some refs to 'origin'"), hint('Commit something first.')]);
  }
  if (state.remote[b] === tip) return result(state, [out('Everything up-to-date')]);
  const pushed = reachable(state, state.remote[b]);
  const fresh = [...reachable(state, tip)].filter((id) => !pushed.has(id)).length;
  const objs = fresh * 3 + 2;
  const prev = state.remote[b];
  const next = {
    ...state,
    remote: { ...state.remote, [b]: tip },
    upstream: { ...state.upstream, [b]: true },
  };
  return result(next, [
    out(`Enumerating objects: ${objs}, done.`),
    out(`Counting objects: 100% (${objs}/${objs}), done.`),
    out(`Writing objects: 100% (${objs}/${objs}), done.`),
    out(`To ${REMOTE_URL}`),
    out(prev ? `   ${prev}..${tip}  ${b} -> ${b}` : ` * [new branch]      ${b} -> ${b}`),
    hint(`simulation: upstream tracking for ${b} is now set, as if you had used -u.`),
  ]);
}

function gitRemote(state, args) {
  if (!state.initialized) return notRepo(state);
  if (!args.length) return result(state, [out('origin')]);
  if (args.length === 1 && (args[0] === '-v' || args[0] === '--verbose')) {
    return result(state, [out(`origin  ${REMOTE_URL} (fetch)`), out(`origin  ${REMOTE_URL} (push)`), hint('Placeholder URL: no real remote exists in this simulation.')]);
  }
  return result(state, [err(`error: 'git remote ${args.join(' ')}' is not supported by the simulator.`)]);
}

const HANDLERS = {
  init: gitInit,
  status: gitStatus,
  add: gitAdd,
  commit: gitCommit,
  log: gitLog,
  branch: gitBranch,
  switch: gitSwitch,
  checkout: gitSwitch,
  merge: gitMerge,
  push: gitPush,
  remote: gitRemote,
};

export function runCommand(state, input, now = Date.now()) {
  const raw = (input || '').trim();
  if (!raw) return result(state, []);
  const parsed = tokenize(raw);
  if (parsed.error) return result(state, [err(`error: ${parsed.error}`)]);
  const [bin, sub, ...args] = parsed.tokens;
  if (bin === 'clear') return { state, output: [], clear: true };
  if (bin === 'help' || (bin === 'git' && (!sub || sub === 'help' || sub === '--help'))) return result(state, helpLines());
  if (bin !== 'git') {
    return result(state, [
      err(`${bin}: command not available in this simulated terminal.`),
      hint('Only the git commands in the reference panel are understood. Nothing typed here is ever run on your computer.'),
    ]);
  }
  const handler = HANDLERS[sub];
  if (!handler) {
    return result(state, [
      err(`git: '${sub}' is not supported by this simulator.`),
      hint(`Try one of: ${Object.keys(HANDLERS).filter((k) => k !== 'checkout').join(', ')}.`),
    ]);
  }
  return handler(state, args, now);
}

export function simulateEdit(state) {
  const taken = new Set([...state.working, ...state.staged]);
  const pool = FILE_POOL.filter((f) => !taken.has(f));
  if (!pool.length) return { state, file: null };
  const file = pool[state.seq % pool.length];
  return { state: { ...state, working: [...state.working, file] }, file };
}

export function suggestMessage(state) {
  const n = state.order.length;
  if (!n) return 'Initial commit';
  const list = state.current === 'main' ? MAIN_MESSAGES : FEATURE_MESSAGES;
  return list[n % list.length];
}

/**
 * Run several commands in order. "@edit" silently simulates a file edit.
 * Every real command is appended to the terminal log. Returns the new state and each output.
 */
export function runBatch(state, commands, now = Date.now()) {
  let s = state;
  const entries = [];
  let cleared = false;
  commands.forEach((cmd) => {
    if (cmd === '@edit') {
      s = simulateEdit(s).state;
      return;
    }
    const r = runCommand(s, cmd, now);
    s = r.state;
    if (r.clear) {
      cleared = true;
      entries.length = 0;
      return;
    }
    entries.push({ cmd, output: r.output });
  });
  if (cleared) s = { ...s, log: [] };
  s = appendLog(s, entries);
  return { state: s, entries };
}

export function suggestNext(state) {
  if (!state.initialized) return { cmd: 'git init', why: 'Create the repository first.' };
  if (state.staged.length) {
    return {
      cmd: `git commit -m "${state.order.length ? 'Update project files' : 'Initial commit'}"`,
      why: 'Save the staged snapshot as a commit.',
    };
  }
  if (state.working.length) return { cmd: 'git add .', why: 'Stage your changes so they can be committed.' };
  const b = state.current;
  if (state.branches[b] && unpushedCount(state, b) > 0) {
    return {
      cmd: state.upstream[b] ? 'git push' : `git push origin ${b}`,
      why: 'Publish your local commits to the simulated remote.',
    };
  }
  return { cmd: null, why: 'Everything is saved and pushed. Click "Edit a file" to start another cycle.' };
}
