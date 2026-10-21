/**
 * Merge lab: a small repository with `main` and `feature-login` that can evolve
 * independently. Uses the same engine as the terminal but also detects conflicts.
 * Every function returns { state, level, message } where level is
 * 'success' | 'info' | 'warning' | 'error'.
 */
import { SCHEMA, addCommit, appendLog, defaultStats, doMerge } from './commandSimulator';

export const FEATURE = 'feature-login';
export const CONFLICT_FILE = 'app.config';
export const OURS = 'title = "Welcome"';
export const THEIRS = 'title = "Login"';
export const CONFLICT_TEXT = `<<<<<<< HEAD\n${OURS}\n=======\n${THEIRS}\n>>>>>>> ${FEATURE}`;

const MAIN_MSGS = ['Update README', 'Fix navbar spacing', 'Refine homepage copy'];
const FEATURE_MSGS = ['Add login form', 'Add login validation', 'Style the login page'];

const out = (text) => ({ t: 'out', text });
const err = (text) => ({ t: 'err', text });
const hint = (text) => ({ t: 'hint', text: `# ${text}` });

export function createLab(now = Date.now()) {
  let s = {
    v: SCHEMA,
    initialized: true,
    current: 'main',
    working: [],
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
  s = addCommit(s, { message: 'Add homepage', parents: [], branch: 'main', touches: ['index.html'], time: now - 3 * 3600e3 });
  const first = s.order[0];
  s = addCommit(s, { message: 'Add login page skeleton', parents: [first], branch: 'main', touches: ['login.js'], time: now - 2 * 3600e3, author: 'Ravi' });
  const base = s.order[1];
  return { ...s, branches: { main: base, [FEATURE]: base } };
}

function addOn(s, branch, kind, now) {
  const parent = s.branches[branch];
  const n = s.order.filter((id) => s.commits[id].branch === branch).length;
  let message;
  let touches;
  let author;
  if (kind === 'title') {
    message = branch === 'main' ? 'Set page title to "Welcome"' : 'Set page title to "Login"';
    touches = [CONFLICT_FILE];
    author = branch === 'main' ? 'Asha' : 'Meena';
  } else if (branch === 'main') {
    message = MAIN_MSGS[n % MAIN_MSGS.length];
    touches = ['README.md'];
    author = 'Asha';
  } else {
    message = FEATURE_MSGS[n % FEATURE_MSGS.length];
    touches = ['login.js'];
    author = 'Ravi';
  }
  const withCommit = addCommit(s, { message, parents: [parent], branch, touches, author, time: now });
  const id = withCommit.order[withCommit.order.length - 1];
  return { ...withCommit, branches: { ...withCommit.branches, [branch]: id } };
}

export function labAddCommit(lab, branch, kind = 'plain', now = Date.now()) {
  if (lab.merging) return { state: lab, level: 'warning', message: 'A merge is in progress. Resolve or abort it before adding commits.' };
  const s = addOn({ ...lab, lastOutcome: null }, branch, kind, now);
  const c = s.commits[s.branches[branch]];
  return { state: s, level: 'success', message: `Added "${c.message}" to ${branch}.` };
}

export function labPreset(name, now = Date.now()) {
  let s = createLab(now);
  if (name === 'fast-forward') {
    s = addOn(s, FEATURE, 'plain', now - 40 * 60e3);
    s = addOn(s, FEATURE, 'plain', now - 20 * 60e3);
  } else if (name === 'three-way') {
    s = addOn(s, 'main', 'plain', now - 40 * 60e3);
    s = addOn(s, FEATURE, 'plain', now - 30 * 60e3);
    s = addOn(s, FEATURE, 'plain', now - 20 * 60e3);
  } else if (name === 'conflict') {
    s = addOn(s, 'main', 'title', now - 40 * 60e3);
    s = addOn(s, FEATURE, 'title', now - 30 * 60e3);
  }
  const labels = {
    'fast-forward': 'Fast-forward scenario loaded: only feature-login has new commits.',
    'three-way': 'Three-way scenario loaded: both branches have new commits on different files.',
    conflict: 'Conflict scenario loaded: both branches changed the title line.',
  };
  return { state: s, level: 'info', message: labels[name] || 'Lab reset.' };
}

export function labMerge(lab, now = Date.now()) {
  if (lab.merging) return { state: lab, level: 'warning', message: 'A merge is already in progress. Resolve the conflict or abort it.' };
  const r = doMerge(lab, FEATURE, { detectConflicts: true, now });
  let s = appendLog(r.state, [{ cmd: `git merge ${FEATURE}`, output: r.output }]);
  if (r.type === 'conflict') {
    s = {
      ...s,
      merging: { branch: FEATURE, file: r.file, ours: OURS, theirs: THEIRS },
      resolution: { choice: null, custom: 'title = "Welcome to Login"', marked: false, staged: false },
      lastOutcome: { type: 'conflict' },
    };
    return { state: s, level: 'warning', message: `Merge stopped: ${r.file} has a conflict that needs your decision.` };
  }
  if (r.type === 'noop') return { state: s, level: 'info', message: 'Already up to date. Add a commit to feature-login first.' };
  if (r.type === 'error') return { state: s, level: 'error', message: r.output[0].text };
  s = { ...s, lastOutcome: { type: r.type } };
  return {
    state: s,
    level: 'success',
    message: r.type === 'fast-forward' ? 'Fast-forward merge complete. main moved forward.' : 'Three-way merge complete. A merge commit was created.',
  };
}

export function previewContent(merging, res) {
  if (!merging || !res || !res.choice) return null;
  if (res.choice === 'current') return merging.ours;
  if (res.choice === 'incoming') return merging.theirs;
  if (res.choice === 'both') return `${merging.ours}\n${merging.theirs}`;
  return res.custom;
}

export function validateResolution(content) {
  if (content === null || content === undefined) return 'Choose which change to keep first.';
  if (!content.trim()) return 'The resolved file cannot be empty.';
  if (/^(<{7}|={7}|>{7})/m.test(content)) return 'Conflict markers (<<<<<<<, =======, >>>>>>>) are still in the file. Remove them.';
  return null;
}

export function labChoose(lab, choice, custom) {
  if (!lab.merging) return { state: lab, level: 'info', message: 'There is no conflict to resolve.' };
  const res = { ...lab.resolution, choice, custom: custom ?? lab.resolution.custom, marked: false, staged: false };
  return { state: { ...lab, resolution: res }, level: 'info', message: '' };
}

export function labMarkResolved(lab) {
  if (!lab.merging) return { state: lab, level: 'info', message: 'There is no conflict to resolve.' };
  const problem = validateResolution(previewContent(lab.merging, lab.resolution));
  if (problem) return { state: lab, level: 'error', message: problem };
  return { state: { ...lab, resolution: { ...lab.resolution, marked: true } }, level: 'success', message: 'Conflict marked as resolved. Next: stage the file.' };
}

export function labStage(lab) {
  if (!lab.merging) return { state: lab, level: 'info', message: 'Nothing to stage.' };
  if (!lab.resolution.marked) return { state: lab, level: 'error', message: 'Mark the conflict as resolved before staging the file.' };
  const s = appendLog({ ...lab, resolution: { ...lab.resolution, staged: true } }, [
    { cmd: `git add ${lab.merging.file}`, output: [hint('staged the resolved file')] },
  ]);
  return { state: s, level: 'success', message: `${lab.merging.file} staged. Next: commit the merge.` };
}

export function labCommitResolution(lab, now = Date.now()) {
  if (!lab.merging) return { state: lab, level: 'info', message: 'There is no merge to commit.' };
  if (!lab.resolution.staged) return { state: lab, level: 'error', message: 'Stage the resolved file before committing.' };
  const message = `Merge branch '${FEATURE}': resolve title conflict`;
  const curHead = lab.branches.main;
  const withCommit = addCommit(lab, {
    message,
    parents: [curHead, lab.branches[FEATURE]],
    branch: 'main',
    touches: [lab.merging.file],
    time: now,
  });
  const id = withCommit.order[withCommit.order.length - 1];
  const content = previewContent(lab.merging, lab.resolution);
  const stats = { ...lab.stats, merges: lab.stats.merges + 1, conflicts: lab.stats.conflicts + 1 };
  const s = appendLog(
    {
      ...withCommit,
      branches: { ...withCommit.branches, main: id },
      merging: null,
      resolution: null,
      stats,
      lastOutcome: { type: 'conflict-resolved', content },
    },
    [{ cmd: `git commit -m "${message}"`, output: [out(`[main ${id}] ${message}`)] }],
  );
  return { state: s, level: 'success', message: 'Merge commit created. The conflict is resolved.' };
}

export function labAbort(lab) {
  if (!lab.merging) return { state: lab, level: 'info', message: 'There is no merge to abort.' };
  const s = appendLog({ ...lab, merging: null, resolution: null, lastOutcome: null }, [
    { cmd: 'git merge --abort', output: [hint('merge cancelled; main is exactly as it was before')] },
  ]);
  return { state: s, level: 'info', message: 'Merge aborted. main is unchanged.' };
}

export const labErrorLine = err;
