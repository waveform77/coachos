import { useEffect, useState } from 'react';

export function useMatches(filters?: Record<string, string>) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // fetch logic
    setLoading(false);
  }, [filters]);

  return { matches, loading };
}
