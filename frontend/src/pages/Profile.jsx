import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'

export default function Profile({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMyPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, likes(user_id)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error) setPosts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMyPosts()
  }, [])

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {session.user.email[0].toUpperCase()}
        </div>
        <p className="profile-email">{session.user.email}</p>
        <div className="profile-stats">
          <div>
            <strong>{posts.length}</strong>
            <span>Posts</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">You haven't posted anything yet.</div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            session={session}
            onUpdate={fetchMyPosts}
          />
        ))
      )}
    </div>
  )
}
