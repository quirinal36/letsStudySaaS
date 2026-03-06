import { Outlet, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ session }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <header className="navbar">
        <h1 onClick={() => navigate('/')}>MiniGram</h1>
        <nav>
          <Link to="/">Feed</Link>
          <Link to="/profile">Profile</Link>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
