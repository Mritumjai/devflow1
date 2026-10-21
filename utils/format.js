export function timeAgo(ms, now = Date.now()) {
  if (typeof ms !== 'number') return '';
  const diff = Math.max(0, Math.round((now - ms) / 1000));
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.round(diff / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

export function clockTime(ms) {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function plural(n, word, suffix = 's') {
  return `${n} ${word}${n === 1 ? '' : suffix}`;
}

// Stable colour index for a name (used to tint author dots).
export function nameIndex(name = '', modulo = 5) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % modulo;
}
