import * as React from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './providers/theme-provider'
import { QueryProvider } from './providers/query-provider'
import { router } from './router'

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="coachos-theme">
      <QueryProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          richColors
          expand
          duration={4000}
          closeButton
        />
      </QueryProvider>
    </ThemeProvider>
  )
}
