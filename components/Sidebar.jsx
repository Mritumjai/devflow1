import { PanelLeftClose, PanelLeftOpen, Check, X } from 'lucide-react';
import { SECTIONS, LEARNING_IDS } from '../config/sections';
import { useApp } from '../context/AppState';
import logo from '../assets/logo.svg';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { section, go, visited } = useApp();
  const pct = Math.round((visited.length / LEARNING_IDS.length) * 100);

  const choose = (id) => {
    go(id);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && <div className="scrim" onClick={onCloseMobile} aria-hidden="true" />}
      <aside id="sidebar" className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`} aria-label="Sections">
        <div className="sidebar__brand">
          <img src={logo} alt="" width="28" height="28" />
          <span className="sidebar__name">DevFlow</span>
          <button type="button" className="icon-btn sidebar__close" onClick={onCloseMobile} aria-label="Close navigation">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav>
          <ul className="sidebar__list">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = section === s.id;
              const done = visited.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`nav-item ${active ? 'is-active' : ''}`}
                    onClick={() => choose(s.id)}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? s.label : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="nav-item__label">{s.label}</span>
                    {done && (
                      <span className="nav-item__done" title="Visited">
                        <Check size={13} aria-hidden="true" />
                        <span className="sr-only">visited</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="sidebar__foot">
          <div className="progress" aria-label="Tour progress">
            <div className="progress__text">
              <span className="sidebar__progress-label">Tour progress</span>
              <span>
                {visited.length}/{LEARNING_IDS.length}
              </span>
            </div>
            <div className="progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Sections visited">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button type="button" className="icon-btn sidebar__toggle" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="sidebar">
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        </div>
      </aside>
    </>
  );
}
