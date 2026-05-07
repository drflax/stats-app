import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login') // 'login' o 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-handball-bg2 border border-handball-border2 rounded-2xl max-w-md w-full">
        <div className="flex justify-between items-center border-b border-handball-border p-5">
          <h3 className="font-semibold">
            {mode === 'login' ? 'Iniciar sessió' : 'Crear compte'}
          </h3>
          <button className="text-handball-text2 hover:text-handball-text" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-handball-text3 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-handball-text3 mb-1">Contrasenya</label>
            <input
              type="password"
              className="w-full bg-handball-bg3 border border-handball-border2 rounded-lg p-2 text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-handball-red">{error}</p>}
          <button
            type="submit"
            className="w-full bg-handball-accent text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Carregant...' : mode === 'login' ? 'Iniciar sessió' : 'Registrar-se'}
          </button>
          <div className="text-center text-xs text-handball-text2">
            {mode === 'login' ? (
              <>
                No tens compte?{' '}
                <button type="button" className="text-handball-accent" onClick={() => setMode('register')}>
                  Registra't
                </button>
              </>
            ) : (
              <>
                Ja tens compte?{' '}
                <button type="button" className="text-handball-accent" onClick={() => setMode('login')}>
                  Inicia sessió
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}