import {
  LayoutDashboard,
  History,
  Terminal,
  GitBranch,
  GitMerge,
  Rocket,
  ShieldCheck,
  ListChecks,
} from 'lucide-react';

/** Central navigation config: one entry per section of the app. */
export const SECTIONS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, summary: 'Live summary of everything you try.' },
  { id: 'version-control', label: 'Version control', icon: History, summary: 'Why teams record and share changes.' },
  { id: 'git-basics', label: 'Git basics', icon: Terminal, summary: 'Four areas and the commands between them.' },
  { id: 'branching', label: 'Branching', icon: GitBranch, summary: 'Work on features without touching main.' },
  { id: 'merging', label: 'Merging & conflicts', icon: GitMerge, summary: 'Combine work and settle disagreements.' },
  { id: 'deployment', label: 'Deployment & CI/CD', icon: Rocket, summary: 'From a push to a live, monitored release.' },
  { id: 'environment', label: 'Environment & security', icon: ShieldCheck, summary: 'Keep secrets out of code and out of Git.' },
  { id: 'best-practices', label: 'Best practices', icon: ListChecks, summary: 'The full workflow and a final checklist.' },
];

export const LEARNING_IDS = SECTIONS.filter((s) => s.id !== 'dashboard').map((s) => s.id);
export const sectionById = (id) => SECTIONS.find((s) => s.id === id) || SECTIONS[0];
