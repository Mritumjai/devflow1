import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'devflow:';

/**
 * useState that persists to localStorage.
 * - `initial` may be a value or a factory function.
 * - `validate` (optional) rejects stored data from an older/corrupt shape.
 * - Storage failures (private mode, quota) never crash the app; state stays in memory.
 */
export default function useLocalStorage(key, initial, validate) {
  const fullKey = PREFIX + key;
  const initialRef = useRef(initial);
  const makeInitial = () =>
    typeof initialRef.current === 'function' ? initialRef.current() : initialRef.current;

  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (!validate || validate(parsed)) return parsed;
      }
    } catch {
      /* ignore and fall back to the initial value */
    }
    return makeInitial();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [fullKey, value]);

  const reset = useCallback(() => setValue(makeInitial()), []); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue, reset];
}
