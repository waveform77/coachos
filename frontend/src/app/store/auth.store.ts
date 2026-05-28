import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/shared/types'
import { setClientToken, setClientLogoutFn } from '@/shared/api/client'

interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      const store = {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,

        setAuth: (user: User, accessToken: string) => {
          setClientToken(accessToken)
          set({ user, accessToken, isAuthenticated: true, isLoading: false })
        },

        setAccessToken: (token: string) => {
          setClientToken(token)
          set({ accessToken: token })
        },

        logout: () => {
          setClientToken(null)
          set({ user: null, accessToken: null, isAuthenticated: false })
        },

        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }

      // Register logout with client to handle 401 refresh failures
      setClientLogoutFn(() => store.logout())

      return store
    },
    {
      name: 'coachos-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      // After rehydration, restore auth state and token
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setClientToken(state.accessToken)
          state.isAuthenticated = true
        }
      },
    }
  )
)
