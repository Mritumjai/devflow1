/** Small, pure helpers for the environment-variable playground. */

const SECRET_HINT = /(secret|key|token|password|passwd|database|db_url|private|credential)/i;

export function classifyVariable(name) {
  const n = (name || '').trim();
  if (!n) return { state: 'empty', title: 'Type a variable name', text: 'For example: VITE_APP_NAME or DATABASE_URL.' };
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n)) {
    return { state: 'error', title: 'Not a valid name', text: 'Environment variable names use letters, digits, and underscores, and cannot start with a digit.' };
  }
  if (n.startsWith('VITE_')) {
    if (SECRET_HINT.test(n.slice(5))) {
      return {
        state: 'danger',
        title: 'Exposed to the browser — and it looks like a secret',
        text: 'Vite copies every VITE_ variable into the public JavaScript bundle. Anyone can read it. Move this value to a server or to your hosting platform’s secret store.',
      };
    }
    return { state: 'public', title: 'Exposed to browser code (public)', text: 'Vite includes VITE_ variables in the client bundle. Use this only for values that are safe for everyone to see, such as an app name.' };
  }
  return { state: 'server', title: 'Not exposed by Vite', text: 'Vite keeps variables without the VITE_ prefix out of client code. They are available to server-side Node.js code, never in import.meta.env.' };
}

/** Evaluate gitignore-style rules in order; the last matching rule wins. */
export function isIgnored(path, gitignoreText) {
  const clean = (path || '').trim().replace(/^\.\//, '');
  if (!clean) return null;
  let ignored = false;
  gitignoreText.split('\n').forEach((raw) => {
    const rule = raw.trim();
    if (!rule || rule.startsWith('#')) return;
    const negate = rule.startsWith('!');
    let pattern = negate ? rule.slice(1) : rule;
    const dirOnly = pattern.endsWith('/');
    if (dirOnly) pattern = pattern.slice(0, -1);
    const source = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
    const re = dirOnly ? new RegExp(`(^|/)${source}(/|$)`) : new RegExp(`(^|/)${source}$`);
    if (re.test(clean)) ignored = !negate;
  });
  return ignored;
}
