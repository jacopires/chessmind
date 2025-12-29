import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewGame from './pages/NewGame'
import Game from './pages/Game'
import TheLab from './pages/TheLab'
import Settings from './pages/Settings'
import { MainLayout } from './components/MainLayout'
import { AuthProvider } from './lib/auth'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - No Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* App Routes - With MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-game" element={<NewGame />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/lab" element={<TheLab />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
