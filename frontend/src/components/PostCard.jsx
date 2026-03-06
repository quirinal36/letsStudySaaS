import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PostCard({ post, session, onUpdate }) {
  const [likeLoading, setLikeLoading] = useState(false)

  const isLiked = post.likes?.some((like) => like.user_id === session.user.id)
  const likeCount = post.likes?.length || 0
  const isOwner = post.user_id === session.user.id

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleLike = async () => {
    setLikeLoading(true)
    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', session.user.id)
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: session.user.id })
    }
    onUpdate()
    setLikeLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onUpdate()
  }

  return (
    <div className="post-card">
      <div className="post-header">
        <span className="post-author">{post.user_email?.split('@')[0]}</span>
        <span className="post-time">{timeAgo(post.created_at)}</span>
      </div>
      {post.image_url && (
        <img className="post-image" src={post.image_url} alt="Post" />
      )}
      {post.content && (
        <div className="post-content">
          <p className="post-text">{post.content}</p>
        </div>
      )}
      <div className="post-actions">
        <button
          className={`btn-like ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
        >
          {isLiked ? '♥' : '♡'} {likeCount}
        </button>
        {isOwner && (
          <button className="btn-delete" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
