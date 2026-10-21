import { AppProvider, useApp } from './context/AppState';
import AppShell from './components/AppShell';
import Dashboard from './sections/Dashboard';
import VersionControl from './sections/VersionControl';
import GitBasics from './sections/GitBasics';
import Branching from './sections/Branching';
import Merging from './sections/Merging';
import Deployment from './sections/Deployment';
import EnvironmentVariables from './sections/EnvironmentVariables';
import BestPractices from './sections/BestPractices';

const VIEWS = {
  dashboard: Dashboard,
  'version-control': VersionControl,
  'git-basics': GitBasics,
  branching: Branching,
  merging: Merging,
  deployment: Deployment,
  environment: EnvironmentVariables,
  'best-practices': BestPractices,
};

function Router() {
  const { section } = useApp();
  const View = VIEWS[section] || Dashboard;
  return (
    <AppShell>
      <View key={section} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
