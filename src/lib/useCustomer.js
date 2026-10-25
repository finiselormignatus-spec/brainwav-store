import { useEffect, useState, useCallback } from 'react';
import { getCurrentCustomer } from './customers.js';

/** Loads the logged-in customer once per mount. customer is null for guests. */
export function useCustomer() {
  const [state, setState] = useState({ customer: null, loading: true });
  const refresh = useCallback(() => {
    let alive = true;
    getCurrentCustomer()
      .then((customer) => alive && setState({ customer, loading: false }))
      .catch(() => alive && setState({ customer: null, loading: false }));
    return () => { alive = false; };
  }, []);
  useEffect(() => refresh(), [refresh]);
  return { ...state, refresh };
}
