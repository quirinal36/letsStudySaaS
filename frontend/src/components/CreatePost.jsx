import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function CreatePost({ session, onPostCreated }) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return
    setLoading(true)

    let imageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile)

      if (!uploadError) {
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    const { error } = await supabase.from('posts').insert({
      user_id: session.user.id,
      user_email: session.user.email,
      content: content.trim(),
      image_url: imageUrl,
    })

    if (!error) {
      setContent('')
      removeImage()
      onPostCreated()
    }
    setLoading(false)
  }

  return (
    <div className="create-post">
      <textarea
        rows={3}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" />
          <button className="btn-remove-image" onClick={removeImage}>X</button>
        </div>
      )}
      <div className="create-post-actions">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
          Photo
        </button>
        <button
          className="btn-post"
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !imageFile)}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
