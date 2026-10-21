import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StatusPanel from './StatusPanel';
import Toast from './Toast';
import { useApp } from '../context/AppState';
import useLocalStorage from '../hooks/useLocalStorage';
import { SECTIONS, sectionById } from '../config/sections';

export default function AppShell({ children }) {
  const { section, go, toasts, dismiss } = useApp();
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const index = SECTIONS.findIndex((s) => s.id === section);
  const prev = SECTIONS[index - 1];
  const next = SECTIONS[index + 1];

  useEffect(() => {
    document.title = `${sectionById(section).label} · DevFlow`;
    window.scrollTo(0, 0);
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [section]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className={`shell ${collapsed ? 'shell--collapsed' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="shell__body">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <StatusPanel />
        <main id="main" className="main">
          {children}
          <nav className="pager" aria-label="Section navigation">
            {prev ? (
              <button type="button" className="btn btn--ghost" onClick={() => go(prev.id)}>
                <ArrowLeft size={16} aria-hidden="true" /> {prev.label}
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button type="button" className="btn btn--primary" onClick={() => go(next.id)}>
                Next: {next.label} <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </nav>
        </main>
      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
