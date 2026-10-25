import { useCallback, useEffect, useState } from 'react';

/** Loads data with fn(); reload() re-runs it. data is undefined while loading. */
export default function useAsync(fn) {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setError('');
    fn().then(setData).catch((e) => setError(e.message || 'Something went wrong.'));
    // fn is a stable module-level function at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}
