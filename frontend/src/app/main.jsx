import React from 'react'
import { Toaster } from 'sonner'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/literata/latin-400.css'
import '@fontsource/literata/latin-500.css'
import '../i18n'
import PreferencesSync from '../components/common/PreferencesSync'
import { AuthProvider } from '../context/AuthProvider'
import App from './App'
import BusinessTheme from '../components/common/BusinessTheme'
import '../styles/globals.css'
import '../styles/surface.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PreferencesSync />
          <App />
          <BusinessTheme />
          <Toaster
            position="top-right"
            closeButton
            duration={4500}
            visibleToasts={3}
            toastOptions={{
              classNames: { error: 'library-toast-error' },
              style: {
                background: 'var(--toast-background, var(--surface))',
                color: 'var(--toast-color, var(--text))',
                borderColor: 'var(--toast-border, var(--line))',
                fontFamily: 'var(--font-interface)',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
