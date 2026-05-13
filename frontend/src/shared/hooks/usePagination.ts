import { useCallback, useState } from 'react';

export function usePagination(totalItems: number, pageSize = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(totalItems / pageSize);

  const next = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);

  return { page, setPage, next, prev, totalPages, pageSize };
}
