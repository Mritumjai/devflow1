import { Copy } from 'lucide-react';
import { useApp } from '../context/AppState';

const MARKER = /^(<{7}|={7}|>{7})/;

function lineClass(text) {
  if (MARKER.test(text)) return 'code__line code__line--marker';
  if (/^\s*(#|\/\/)/.test(text)) return 'code__line code__line--comment';
  return 'code__line';
}

export default function CodeBlock({ code, title, language, copyable = true }) {
  const { notify } = useApp();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      notify('success', 'Copied to clipboard.');
    } catch {
      notify('warning', 'Copy is not available here. Select the text and copy it manually.');
    }
  };

  return (
    <figure className="code">
      {(title || copyable) && (
        <figcaption className="code__bar">
          <span className="code__title">{title || language}</span>
          {copyable && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={copy} aria-label={`Copy ${title || 'code'}`}>
              <Copy size={14} aria-hidden="true" /> Copy
            </button>
          )}
        </figcaption>
      )}
      <pre tabIndex={0}>
        <code>
          {code.split('\n').map((text, i) => (
            <span key={i} className={lineClass(text)}>
              {text || ' '}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
