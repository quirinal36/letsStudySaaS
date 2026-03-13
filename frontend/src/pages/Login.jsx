import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data?.user?.identities?.length === 0) {
        setError('This email is already registered.')
      } else {
        setMessage('Sign up successful! You can now log in.')
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>MiniGram</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}>
            {isSignUp ? ' Log In' : ' Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
