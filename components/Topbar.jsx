import { useEffect, useState } from 'react';
import { Menu, RotateCcw, Play } from 'lucide-react';
import { useApp } from '../context/AppState';
import { sectionById } from '../config/sections';
import { Badge } from './InfoCard';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'DevFlow';

export default function Topbar({ onOpenMobile }) {
  const { section, resetAll, restartTour } = useApp();
  const [confirming, setConfirming] = useState(false);
  const current = sectionById(section);

  useEffect(() => {
    if (!confirming) return undefined;
    const t = window.setTimeout(() => setConfirming(false), 3500);
    return () => window.clearTimeout(t);
  }, [confirming]);

  const onReset = () => {
    if (confirming) {
      resetAll();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar__menu" onClick={onOpenMobile} aria-label="Open navigation" aria-controls="sidebar">
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="topbar__crumbs">
        <span className="topbar__app">{APP_NAME}</span>
        <span aria-hidden="true" className="topbar__sep">/</span>
        <span className="topbar__page">{current.label}</span>
      </div>
      <div className="topbar__actions">
        <Badge tone="amber">All Git actions are simulated</Badge>
        <button type="button" className="btn btn--ghost btn--sm" onClick={restartTour}>
          <Play size={14} aria-hidden="true" /> <span className="hide-sm">Restart tour</span>
        </button>
        <button type="button" className={`btn btn--sm ${confirming ? 'btn--danger' : 'btn--ghost'}`} onClick={onReset}>
          <RotateCcw size={14} aria-hidden="true" /> <span className="hide-sm">{confirming ? 'Click again to confirm' : 'Reset demo'}</span>
          <span className="sr-only">{confirming ? '' : ' all demo data'}</span>
        </button>
      </div>
    </header>
  );
}
