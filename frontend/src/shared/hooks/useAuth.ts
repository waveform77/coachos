import { useCallback, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const login = useCallback(() => {}, []);
  const logout = useCallback(() => setUser(null), []);
  return { user, isAuthenticated: !!user, login, logout };
}
