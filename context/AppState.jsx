import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { SECTIONS, LEARNING_IDS } from '../config/sections';
import { createRepo, isValidSim, runBatch, simulateEdit, suggestMessage } from '../utils/commandSimulator';
import * as labApi from '../utils/mergeLab';
import * as deployApi from '../utils/deploySim';
import { summarizeProject } from '../utils/summary';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

const parseHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return SECTIONS.some((s) => s.id === id) ? id : 'dashboard';
};

export function AppProvider({ children }) {
  const [repo, setRepo, resetRepoState] = useLocalStorage('repo', createRepo, isValidSim);
  const [lab, setLab, resetLabState] = useLocalStorage('lab', labApi.createLab, isValidSim);
  const [deploy, setDeploy, resetDeployState] = useLocalStorage('deploy', deployApi.createDeploy, isValidSim);
  const [visited, setVisited, resetVisited] = useLocalStorage('visited', []);
  const [envChecks, setEnvChecks, resetEnvChecks] = useLocalStorage('env-checks', {});
  const [section, setSection] = useState(parseHash);
  const [toasts, setToasts] = useState([]);

  const repoRef = useRef(repo);
  const labRef = useRef(lab);
  const deployRef = useRef(deploy);
  repoRef.current = repo;
  labRef.current = lab;
  deployRef.current = deploy;
  const toastId = useRef(0);

  /* ----- notifications ----- */
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (type, text) => {
      if (!text) return;
      toastId.current += 1;
      const id = toastId.current;
      setToasts((t) => [...t.slice(-3), { id, type, text }]);
      window.setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  /* ----- navigation ----- */
  useEffect(() => {
    const onHash = () => setSection(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((id) => {
    if (window.location.hash === `#/${id}`) setSection(id);
    else window.location.hash = `/${id}`;
  }, []);

  useEffect(() => {
    if (section !== 'dashboard') setVisited((v) => (v.includes(section) ? v : [...v, section]));
  }, [section, setVisited]);

  /* ----- Git simulation (main repo) ----- */
  const commitRepo = useCallback(
    (next) => {
      repoRef.current = next;
      setRepo(next);
    },
    [setRepo],
  );

  const runGit = useCallback(
    (cmd) => {
      const { state, entries } = runBatch(repoRef.current, [cmd]);
      commitRepo(state);
      const output = entries[0]?.output || [];
      return { output, ok: !output.some((l) => l.t === 'err') };
    },
    [commitRepo],
  );

  const runGitAndNotify = useCallback(
    (cmd, successText) => {
      const res = runGit(cmd);
      const firstErr = res.output.find((l) => l.t === 'err');
      if (firstErr) notify('error', firstErr.text);
      else notify('success', successText || `Ran ${cmd} (simulated).`);
      return res;
    },
    [notify, runGit],
  );

  const editFile = useCallback(() => {
    const { state, file } = simulateEdit(repoRef.current);
    if (!file) {
      notify('info', 'Every sample file already has changes. Stage and commit them first.');
      return;
    }
    commitRepo(state);
    notify('success', `Edited ${file} in the working directory (simulated).`);
  }, [commitRepo, notify]);

  const quickCommit = useCallback(() => {
    const s = repoRef.current;
    if (!s.initialized || !s.branches[s.current]) {
      notify('warning', 'Create the starter repository first.');
      return;
    }
    const msg = suggestMessage(s);
    const { state } = runBatch(s, ['@edit', 'git add .', `git commit -m "${msg}"`]);
    commitRepo(state);
    notify('success', `Committed "${msg}" on ${s.current} (simulated).`);
  }, [commitRepo, notify]);

  const seedRepo = useCallback(() => {
    const s = repoRef.current;
    const cmds = [];
    if (!s.initialized) cmds.push('git init');
    if (!s.branches[s.current || 'main']) cmds.push('git add .', 'git commit -m "Initial commit"');
    if (!cmds.length) return;
    const { state } = runBatch(s, cmds);
    commitRepo(state);
    notify('success', 'Starter repository created (simulated).');
  }, [commitRepo, notify]);

  const resetRepo = useCallback(() => {
    const fresh = createRepo();
    repoRef.current = fresh;
    resetRepoState();
    notify('info', 'Repository simulation reset.');
  }, [notify, resetRepoState]);

  /* ----- Merge lab ----- */
  const labDo = useCallback(
    (fn, ...args) => {
      const res = fn(labRef.current, ...args);
      labRef.current = res.state;
      setLab(res.state);
      if (res.message) notify(res.level === 'error' ? 'error' : res.level, res.message);
      return res;
    },
    [notify, setLab],
  );

  const labActions = useMemo(
    () => ({
      commit: (branch, kind) => labDo(labApi.labAddCommit, branch, kind),
      merge: () => labDo(labApi.labMerge),
      choose: (choice, custom) => labDo(labApi.labChoose, choice, custom),
      mark: () => labDo(labApi.labMarkResolved),
      stage: () => labDo(labApi.labStage),
      commitResolution: () => labDo(labApi.labCommitResolution),
      abort: () => labDo(labApi.labAbort),
      preset: (name) => labDo((_, n) => labApi.labPreset(n), name),
      reset: () => labDo(() => ({ state: labApi.createLab(), level: 'info', message: 'Merge lab reset.' })),
    }),
    [labDo],
  );

  /* ----- Deployment ----- */
  const deployDo = useCallback(
    (fn, ...args) => {
      const res = fn(deployRef.current, ...args);
      deployRef.current = res.state;
      setDeploy(res.state);
      if (res.message) notify(res.level, res.message);
      return res;
    },
    [notify, setDeploy],
  );

  const deployActions = useMemo(
    () => ({
      start: (message) => deployDo(deployApi.startRun, { message }),
      advance: () => deployDo(deployApi.advanceRun),
      rollback: (env) => deployDo(deployApi.rollback, env),
      setTarget: (target) => {
        const next = { ...deployRef.current, target };
        deployRef.current = next;
        setDeploy(next);
      },
      setWillFail: (willFail) => {
        const next = { ...deployRef.current, willFail };
        deployRef.current = next;
        setDeploy(next);
      },
      reset: () => deployDo(() => ({ state: deployApi.createDeploy(), level: 'info', message: 'Deployment simulation reset.' })),
    }),
    [deployDo, setDeploy],
  );

  /* ----- Progress ----- */
  const toggleEnvCheck = useCallback(
    (id) => setEnvChecks((c) => ({ ...c, [id]: !c[id] })),
    [setEnvChecks],
  );

  const restartTour = useCallback(() => {
    resetVisited();
    notify('info', 'Tour restarted. Your demo data is kept; use Reset demo to clear it.');
    go(LEARNING_IDS[0]);
  }, [go, notify, resetVisited]);

  const resetAll = useCallback(() => {
    repoRef.current = createRepo();
    labRef.current = labApi.createLab();
    deployRef.current = deployApi.createDeploy();
    resetRepoState();
    resetLabState();
    resetDeployState();
    resetVisited();
    resetEnvChecks();
    notify('success', 'All demo data was reset.');
  }, [notify, resetDeployState, resetEnvChecks, resetLabState, resetRepoState, resetVisited]);

  const summary = useMemo(() => summarizeProject({ repo, lab, deploy, visited }), [repo, lab, deploy, visited]);

  const value = {
    section, go, repo, runGit, runGitAndNotify, editFile, quickCommit, seedRepo, resetRepo,
    lab, labActions, deploy, deployActions, visited, envChecks, toggleEnvCheck,
    restartTour, resetAll, summary, toasts, dismiss, notify,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
