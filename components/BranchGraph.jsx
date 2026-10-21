import { useEffect, useMemo, useRef } from 'react';

const COLORS = ['#22d3ee', '#60a5fa', '#34d399', '#fbbf24', '#c4b5fd', '#f87171'];
const STEP = 70;
const LANE_H = 70;
const LEFT = 120;

const pillWidth = (text) => Math.max(40, text.length * 6.6 + 18);

/**
 * Draws commits as nodes on one lane per branch. Lanes come from the branch a commit
 * was created on, so a fast-forwarded main correctly points at commits drawn on the feature lane.
 */
export default function BranchGraph({ commits, order, branches, current, remote = {}, placeholderLanes = [], label = 'Branch graph' }) {
  const scrollRef = useRef(null);

  const model = useMemo(() => {
    const names = [];
    order.forEach((id) => {
      const b = commits[id].branch;
      if (!names.includes(b)) names.push(b);
    });
    Object.keys(branches).forEach((b) => {
      if (!names.includes(b)) names.push(b);
    });
    placeholderLanes.forEach((b) => {
      if (!names.includes(b)) names.push(b);
    });
    names.sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : 0));

    const labelsAt = {};
    Object.keys(branches).forEach((b) => {
      const id = branches[b];
      if (!id) return;
      (labelsAt[id] = labelsAt[id] || { heads: [], remotes: [] }).heads.push(b);
    });
    Object.keys(remote).forEach((b) => {
      const id = remote[b];
      if (!id) return;
      (labelsAt[id] = labelsAt[id] || { heads: [], remotes: [] }).remotes.push(b);
    });
    const maxHeads = Math.max(1, ...Object.values(labelsAt).map((l) => l.heads.length));
    const top = 28 + maxHeads * 26;
    const pos = {};
    order.forEach((id, i) => {
      pos[id] = { x: LEFT + i * STEP, y: top + names.indexOf(commits[id].branch) * LANE_H };
    });
    const width = LEFT + Math.max(order.length, 1) * STEP + 120;
    const height = top + names.length * LANE_H + 60;
    return { names, labelsAt, pos, top, width, height };
  }, [commits, order, branches, remote, placeholderLanes]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [order.length]);

  const { names, labelsAt, pos, top, width, height } = model;
  const colorOf = (lane) => COLORS[names.indexOf(lane) % COLORS.length];
  const summary = `${label}: ${order.length} commits across ${names.join(', ')}. Current branch ${current || 'none'}.`;

  return (
    <div className="graph-scroll" ref={scrollRef} tabIndex={0} role="group" aria-label={summary}>
      <svg className="graph" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
        {names.map((lane, i) => {
          const y = top + i * LANE_H;
          const exists = order.some((id) => commits[id].branch === lane) || branches[lane];
          return (
            <g key={lane}>
              <line x1={LEFT - 20} x2={width - 20} y1={y} y2={y} className="graph__lane" strokeDasharray={exists ? '2 6' : '4 6'} opacity={exists ? 0.5 : 0.35} />
              <text x={12} y={y + 4} className={`graph__lane-label ${exists ? '' : 'is-missing'}`} fill={colorOf(lane)}>
                {lane.length > 14 ? `${lane.slice(0, 13)}…` : lane}
              </text>
              {!exists && (
                <text x={LEFT} y={y - 10} className="graph__hint">
                  not created yet
                </text>
              )}
            </g>
          );
        })}

        {order.flatMap((id) =>
          commits[id].parents
            .filter((p) => pos[p])
            .map((p, pi) => {
              const a = pos[p];
              const b = pos[id];
              const stroke = pi === 0 ? colorOf(commits[id].branch) : colorOf(commits[p].branch);
              const d = a.y === b.y ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} C${a.x + 34} ${a.y}, ${b.x - 34} ${b.y}, ${b.x} ${b.y}`;
              return <path key={`${p}-${id}`} d={d} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
            }),
        )}

        {order.map((id) => {
          const c = commits[id];
          const { x, y } = pos[id];
          const color = colorOf(c.branch);
          const isHead = branches[current] === id;
          const merge = c.parents.length > 1;
          return (
            <g key={id}>
              <title>{`${c.message} — ${c.author} (${id})`}</title>
              {isHead && <circle cx={x} cy={y} r="15" fill="none" stroke={color} strokeWidth="2" opacity="0.55" />}
              <circle cx={x} cy={y} r="9" fill={isHead || merge ? color : 'var(--bg)'} stroke={color} strokeWidth="3" />
              <text x={x} y={y + 28} textAnchor="middle" className="graph__id">
                {id}
              </text>
            </g>
          );
        })}

        {Object.entries(labelsAt).map(([id, l]) => {
          if (!pos[id]) return null;
          const { x, y } = pos[id];
          return (
            <g key={`lab-${id}`}>
              {l.heads.map((b, i) => {
                const text = b === current ? `HEAD → ${b}` : b;
                const w = pillWidth(text);
                const py = y - 30 - i * 26;
                return (
                  <g key={b}>
                    <rect x={x - w / 2} y={py - 11} width={w} height="22" rx="5" fill={b === current ? colorOf(commits[id].branch) : 'var(--surface)'} stroke={colorOf(commits[id].branch)} strokeWidth="1.5" />
                    <text x={x} y={py + 4} textAnchor="middle" className="graph__pill" fill={b === current ? '#04111d' : 'var(--text)'}>
                      {text}
                    </text>
                  </g>
                );
              })}
              {l.remotes.map((b, i) => {
                const text = `origin/${b}`;
                const w = pillWidth(text);
                const py = y + 48 + i * 24;
                return (
                  <g key={`r-${b}`}>
                    <rect x={x - w / 2} y={py - 10} width={w} height="20" rx="5" fill="none" stroke="var(--muted)" strokeDasharray="3 3" />
                    <text x={x} y={py + 4} textAnchor="middle" className="graph__pill graph__pill--remote">
                      {text}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
