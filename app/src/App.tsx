import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import NewGame from './pages/NewGame'
import Game from './pages/Game'
import Settings from './pages/Settings'
import { AuthProvider } from './lib/auth'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/new-game" element={<NewGame />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/new-game" replace />} />
          <Route path="/dashboard" element={<Navigate to="/new-game" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
