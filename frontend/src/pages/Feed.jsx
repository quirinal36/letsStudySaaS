import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CreatePost from '../components/CreatePost'
import PostCard from '../components/PostCard'

export default function Feed({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, likes(user_id)')
      .order('created_at', { ascending: false })

    if (!error) setPosts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  if (loading) return <div className="loading">Loading posts...</div>

  return (
    <div className="feed">
      <CreatePost session={session} onPostCreated={fetchPosts} />
      {posts.length === 0 ? (
        <div className="empty-state">No posts yet. Be the first to share!</div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            session={session}
            onUpdate={fetchPosts}
          />
        ))
      )}
    </div>
  )
}
