import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthProvider, useAuth } from './lib/AuthProvider'
import { RoleProvider } from './lib/RoleContext'

function Providers({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  // Optionally, show a loading spinner while auth is loading
  if (loading) return <div>Loading...</div>
  return <RoleProvider user={user}>{children}</RoleProvider>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Providers>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </Providers>
    </AuthProvider>
  </React.StrictMode>,
)
