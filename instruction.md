# MiniGram - 처음부터 끝까지 따라하기

이 문서를 위에서부터 순서대로 따라하면 인스타그램 스타일의 SNS 웹앱을 완성할 수 있습니다.
모든 코드와 설정이 포함되어 있으니, **복사 & 붙여넣기**만으로 진행 가능합니다.

---

## PART 1. 사전 준비 (10분)

### 1-1. 필요한 프로그램 설치

아래 3가지가 설치되어 있어야 합니다. 터미널(명령 프롬프트)을 열어 확인하세요.

```bash
node --version    # v18 이상이면 OK
python --version  # 3.9 이상이면 OK
git --version     # 아무 버전이나 OK
```

설치가 안 되어 있다면:
- **Node.js**: https://nodejs.org 에서 LTS 버전 다운로드 & 설치
- **Python**: https://www.python.org 에서 다운로드 & 설치 (설치 시 "Add to PATH" 반드시 체크!)
- **Git**: https://git-scm.com 에서 다운로드 & 설치

### 1-2. 프로젝트 폴더 생성

터미널을 열고 아래 명령어를 순서대로 실행하세요.

```bash
mkdir letsStudySaaS
cd letsStudySaaS
git init
```

---

## PART 2. Supabase 설정 (15분)

### 2-1. Supabase 프로젝트 생성

1. 브라우저에서 https://supabase.com 접속
2. **GitHub 계정**으로 회원가입/로그인
3. 대시보드에서 **"New Project"** 버튼 클릭
4. 아래 항목 입력:
   - **Project name**: `minigram`
   - **Database Password**: 원하는 비밀번호 입력 (메모해두세요!)
   - **Region**: `Northeast Asia (Tokyo)` 선택
5. **"Create new project"** 클릭
6. 약 1~2분 기다리면 프로젝트가 생성됩니다

### 2-2. 이메일 인증 비활성화

> 개발 편의를 위해 이메일 인증을 끕니다. (실제 서비스에서는 켜야 합니다)

1. 왼쪽 메뉴에서 **Authentication** 클릭
2. 상단 탭에서 **Providers** 클릭
3. **Email** 항목을 클릭하여 펼침
4. **"Confirm email"** 토글을 **OFF**로 변경
5. **Save** 클릭

### 2-3. 데이터베이스 테이블 생성

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **"New Query"** 클릭
3. 아래 SQL을 **전체 복사**하여 붙여넣기
4. 우측 하단 **"Run"** 클릭 (또는 Ctrl+Enter)
5. `Success. No rows returned` 메시지가 나오면 성공!

```sql
-- 1. posts 테이블: 게시물 저장
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. likes 테이블: 좋아요 저장
CREATE TABLE likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 4. Posts 정책
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- 5. Likes 정책
CREATE POLICY "Anyone can read likes"
  ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE USING (auth.uid() = user_id);
```

### 2-4. 테이블 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. `posts`와 `likes` 두 개의 테이블이 보이면 성공!

### 2-5. Storage 버킷 생성 (이미지 업로드용)

1. 왼쪽 메뉴에서 **Storage** 클릭
2. **"New bucket"** 클릭
3. 설정:
   - **Name of bucket**: `post-images`
   - **Public bucket**: 토글 **ON**
4. **"Create bucket"** 클릭

### 2-6. Storage 정책 추가

상단 탭에서 **Policies** 클릭 후, `POST-IMAGES` 항목에서 정책을 3개 추가합니다.

**[정책 1] 이미지 조회 - SELECT**

1. `POST-IMAGES` 옆의 **"New policy"** 클릭
2. **"For full customization"** 선택
3. 설정:
   - **Policy name**: `allow public read`
   - **Allowed operation**: `SELECT` 체크
   - **Target roles**: 그대로 두기 (Defaults to all)
   - **Policy definition**: `bucket_id = 'post-images'` (자동 입력 그대로)
4. **Review** > **Save policy**

**[정책 2] 이미지 업로드 - INSERT**

1. **"New policy"** > **"For full customization"**
2. 설정:
   - **Policy name**: `allow authenticated upload`
   - **Allowed operation**: `INSERT` 체크
   - **Target roles**: 드롭다운에서 `authenticated` 선택
   - **Policy definition**: `bucket_id = 'post-images'` (자동 입력 그대로)
3. **Review** > **Save policy**

**[정책 3] 이미지 삭제 - DELETE**

1. **"New policy"** > **"For full customization"**
2. 설정:
   - **Policy name**: `allow owner delete`
   - **Allowed operation**: `DELETE` 체크
   - **Target roles**: 드롭다운에서 `authenticated` 선택
   - **Policy definition**: `bucket_id = 'post-images'` (자동 입력 그대로)
3. **Review** > **Save policy**

### 2-7. API 키 메모하기

1. 왼쪽 메뉴에서 **Settings** (톱니바퀴) 클릭
2. **API** 탭 클릭
3. 아래 3개 값을 메모장에 복사해두세요:

| 항목 | 어디에 쓰이나? |
|------|---------------|
| **Project URL** (`https://xxxxx.supabase.co`) | Frontend + Backend |
| **anon public key** (`eyJhbG...`) | Frontend 전용 |
| **service_role key** (`eyJhbG...`) | Backend 전용 (절대 공개 금지!) |

---

## PART 3. Frontend 만들기 (25분)

### 3-1. React + Vite 프로젝트 생성

프로젝트 루트 폴더(`letsStudySaaS`)에서 실행:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom @supabase/supabase-js axios
```

### 3-2. 환경변수 파일 생성

`frontend/.env` 파일을 새로 만들고 아래 내용을 입력하세요.
(**xxxxx** 부분을 2-7에서 메모한 값으로 교체!)

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=여기에_anon_public_key_붙여넣기
VITE_API_URL=http://localhost:5000
```

### 3-3. Supabase 연결 파일 생성

`frontend/src/lib/` 폴더를 만들고 `supabase.js` 파일을 생성하세요.

**파일**: `frontend/src/lib/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3-4. index.css 수정

`frontend/src/index.css` 파일의 **기존 내용을 모두 지우고** 아래로 교체:

**파일**: `frontend/src/index.css`
```css
:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #262626;
  background-color: #fafafa;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
```

### 3-5. App.css 수정

`frontend/src/App.css` 파일의 **기존 내용을 모두 지우고** 아래로 교체:

**파일**: `frontend/src/App.css`
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #fafafa;
  color: #262626;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #8e8e8e;
}

.app-layout {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #dbdbdb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar h1 {
  font-family: 'Georgia', serif;
  font-size: 1.5rem;
  cursor: pointer;
}

.navbar nav {
  display: flex;
  gap: 16px;
  align-items: center;
}

.navbar nav a {
  text-decoration: none;
  color: #262626;
  font-weight: 500;
  font-size: 0.9rem;
}

.navbar nav a:hover {
  color: #0095f6;
}

.btn-logout {
  background: none;
  border: none;
  color: #0095f6;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #fafafa;
}

.login-box {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 40px;
  width: 350px;
  text-align: center;
}

.login-box h1 {
  font-family: 'Georgia', serif;
  font-size: 2rem;
  margin-bottom: 24px;
}

.login-box input {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #fafafa;
}

.login-box input:focus {
  outline: none;
  border-color: #a8a8a8;
}

.btn-primary {
  width: 100%;
  padding: 10px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 8px;
}

.btn-primary:hover {
  background: #1877f2;
}

.btn-primary:disabled {
  background: #b2dffc;
  cursor: not-allowed;
}

.toggle-auth {
  margin-top: 16px;
  font-size: 0.85rem;
  color: #8e8e8e;
}

.toggle-auth button {
  background: none;
  border: none;
  color: #0095f6;
  font-weight: 600;
  cursor: pointer;
}

.error-msg {
  color: #ed4956;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.success-msg {
  color: #2ecc71;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.feed {
  padding: 16px;
}

.create-post {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.create-post textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 0.95rem;
  padding: 8px 0;
  font-family: inherit;
}

.create-post textarea:focus {
  outline: none;
}

.create-post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #efefef;
}

.btn-upload {
  background: none;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #262626;
}

.btn-post {
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-post:disabled {
  background: #b2dffc;
  cursor: not-allowed;
}

.image-preview {
  margin-top: 8px;
  position: relative;
}

.image-preview img {
  width: 100%;
  border-radius: 4px;
  max-height: 300px;
  object-fit: cover;
}

.btn-remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 0.8rem;
}

.post-card {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.post-author {
  font-weight: 600;
  font-size: 0.9rem;
}

.post-time {
  font-size: 0.75rem;
  color: #8e8e8e;
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}

.post-content {
  padding: 12px 16px;
}

.post-text {
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 8px;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding: 8px 16px 12px;
}

.btn-like {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #262626;
}

.btn-like.liked {
  color: #ed4956;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: #8e8e8e;
  margin-left: auto;
}

.btn-delete:hover {
  color: #ed4956;
}

.profile-page {
  padding: 24px 16px;
}

.profile-header {
  text-align: center;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #dbdbdb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 2rem;
  color: white;
}

.profile-email {
  color: #8e8e8e;
  font-size: 0.9rem;
}

.profile-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 12px;
}

.profile-stats div {
  text-align: center;
}

.profile-stats strong {
  display: block;
  font-size: 1.1rem;
}

.profile-stats span {
  font-size: 0.8rem;
  color: #8e8e8e;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8e8e8e;
}
```

### 3-6. App.jsx 수정

`frontend/src/App.jsx` 파일의 **기존 내용을 모두 지우고** 아래로 교체:

**파일**: `frontend/src/App.jsx`
```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Feed session={session} />} />
          <Route path="/profile" element={<Profile session={session} />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
```

### 3-7. 컴포넌트 파일 생성

`frontend/src/components/` 폴더를 만들고 아래 3개 파일을 생성하세요.

**파일**: `frontend/src/components/Layout.jsx`
```jsx
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
```

**파일**: `frontend/src/components/CreatePost.jsx`
```jsx
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
```

**파일**: `frontend/src/components/PostCard.jsx`
```jsx
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
```

### 3-8. 페이지 파일 생성

`frontend/src/pages/` 폴더를 만들고 아래 3개 파일을 생성하세요.

**파일**: `frontend/src/pages/Login.jsx`
```jsx
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
```

**파일**: `frontend/src/pages/Feed.jsx`
```jsx
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
```

**파일**: `frontend/src/pages/Profile.jsx`
```jsx
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
```

### 3-9. Frontend 실행 테스트

```bash
cd frontend
npm run dev
```

브라우저에서 http://localhost:5173 접속하여 로그인 화면이 보이면 성공!

---

## PART 4. Backend 만들기 (20분)

### 4-1. Backend 폴더 생성

프로젝트 루트 폴더(`letsStudySaaS`)에서:

```bash
mkdir backend
cd backend
```

### 4-2. requirements.txt 생성

**파일**: `backend/requirements.txt`
```
flask==3.1.0
flask-cors==5.0.1
flask-restx==1.3.0
supabase==2.13.0
python-dotenv==1.1.0
```

### 4-3. 가상환경 생성 및 패키지 설치

```bash
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 4-4. 환경변수 파일 생성

`backend/.env` 파일을 새로 만들고 아래 내용을 입력하세요.
(**xxxxx** 부분을 2-7에서 메모한 값으로 교체!)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=여기에_service_role_key_붙여넣기
```

### 4-5. app.py 생성

**파일**: `backend/app.py`
```python
import os
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from supabase import create_client

load_dotenv()

app = Flask(__name__)
CORS(app)

api = Api(
    app,
    version='1.0',
    title='MiniGram API',
    description='A simple SNS API built with Flask and Swagger',
    doc='/docs'
)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Namespaces
ns_posts = api.namespace('api/posts', description='Post operations')
ns_likes = api.namespace('api/likes', description='Like operations')
ns_health = api.namespace('api', description='Health check')

# Models for Swagger docs
post_model = api.model('Post', {
    'user_id': fields.String(required=True, description='User ID'),
    'user_email': fields.String(required=True, description='User email'),
    'content': fields.String(description='Post content'),
    'image_url': fields.String(description='Image URL'),
})

like_model = api.model('Like', {
    'post_id': fields.Integer(required=True, description='Post ID'),
    'user_id': fields.String(required=True, description='User ID'),
})


@ns_health.route('/health')
class HealthCheck(Resource):
    def get(self):
        """Health check endpoint"""
        return {'status': 'ok', 'message': 'MiniGram API is running'}


@ns_posts.route('/')
class PostList(Resource):
    def get(self):
        """Get all posts"""
        response = supabase.table('posts') \
            .select('*, likes(user_id)') \
            .order('created_at', desc=True) \
            .execute()
        return response.data

    @ns_posts.expect(post_model)
    def post(self):
        """Create a new post"""
        data = request.json
        response = supabase.table('posts').insert({
            'user_id': data['user_id'],
            'user_email': data['user_email'],
            'content': data.get('content', ''),
            'image_url': data.get('image_url'),
        }).execute()
        return response.data, 201


@ns_posts.route('/<int:post_id>')
class PostItem(Resource):
    def get(self, post_id):
        """Get a specific post"""
        response = supabase.table('posts') \
            .select('*, likes(user_id)') \
            .eq('id', post_id) \
            .single() \
            .execute()
        return response.data

    def delete(self, post_id):
        """Delete a post"""
        supabase.table('posts').delete().eq('id', post_id).execute()
        return {'message': 'Post deleted'}, 200


@ns_likes.route('/')
class LikeList(Resource):
    @ns_likes.expect(like_model)
    def post(self):
        """Like a post"""
        data = request.json
        response = supabase.table('likes').insert({
            'post_id': data['post_id'],
            'user_id': data['user_id'],
        }).execute()
        return response.data, 201


@ns_likes.route('/<int:post_id>/<string:user_id>')
class LikeItem(Resource):
    def delete(self, post_id, user_id):
        """Unlike a post"""
        supabase.table('likes').delete() \
            .eq('post_id', post_id) \
            .eq('user_id', user_id) \
            .execute()
        return {'message': 'Like removed'}, 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### 4-6. Vercel 배포 설정 파일 생성

**파일**: `backend/vercel.json`
```json
{
  "builds": [
    { "src": "app.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "app.py" }
  ]
}
```

### 4-7. Backend 실행 테스트

```bash
python app.py
```

성공하면:
```
 * Running on http://127.0.0.1:5000
```

브라우저에서 http://localhost:5000/docs 접속하면 Swagger API 문서를 볼 수 있습니다!

---

## PART 5. 전체 테스트 (10분)

### 5-1. 두 서버 동시 실행

**터미널 1** (Backend):
```bash
cd backend
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Mac/Linux
python app.py
```

**터미널 2** (Frontend):
```bash
cd frontend
npm run dev
```

### 5-2. 기능 테스트 체크리스트

브라우저에서 http://localhost:5173 접속 후:

- [ ] **회원가입**: 하단 "Sign Up" 클릭 > 이메일/비밀번호(6자 이상) 입력 > Sign Up
- [ ] **로그인**: 가입한 이메일/비밀번호로 Log In
- [ ] **게시물 작성**: 텍스트 입력 > Post 클릭
- [ ] **이미지 업로드**: Photo 클릭 > 이미지 선택 > Post 클릭
- [ ] **좋아요**: 게시물의 하트(♡) 클릭 > 빨간 하트(♥)로 변경 확인
- [ ] **좋아요 취소**: 빨간 하트(♥) 다시 클릭
- [ ] **게시물 삭제**: 본인 게시물의 Delete 클릭
- [ ] **프로필**: 상단 Profile 클릭 > 내 게시물만 표시 확인
- [ ] **로그아웃**: 상단 Logout 클릭
- [ ] **Swagger**: http://localhost:5000/docs 접속 > API 목록 확인

---

## PART 6. .gitignore 설정

프로젝트 루트에 `.gitignore` 파일을 만드세요.

**파일**: `letsStudySaaS/.gitignore`
```
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Environment
.env
.env.local

# Build
frontend/dist/
*.egg-info/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## PART 7. GitHub에 올리기 (5분)

### 7-1. GitHub 저장소 생성

1. https://github.com 접속 > 로그인
2. 우측 상단 **"+"** > **"New repository"**
3. **Repository name**: `letsStudySaaS`
4. **Public** 선택
5. **"Create repository"** 클릭

### 7-2. 코드 Push

```bash
cd letsStudySaaS
git add .
git commit -m "Initial commit: MiniGram SNS app"
git remote add origin https://github.com/YOUR_USERNAME/letsStudySaaS.git
git branch -M main
git push -u origin main
```

> **YOUR_USERNAME** 을 본인의 GitHub 아이디로 바꾸세요!

---

## PART 8. Vercel 배포 (10분)

### 8-1. Frontend 배포

1. https://vercel.com 접속 > GitHub 계정으로 로그인
2. **"Add New Project"** 클릭
3. GitHub에서 `letsStudySaaS` 저장소를 **Import**
4. 설정:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Edit 클릭하여 입력)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables** 에 아래 2개 추가:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon public key
6. **"Deploy"** 클릭!
7. 배포 완료 후 나오는 URL을 메모 (예: `https://minigram-xxxx.vercel.app`)

### 8-2. Backend 배포

1. Vercel에서 다시 **"Add New Project"** 클릭
2. 같은 `letsStudySaaS` 저장소 Import
3. 설정:
   - **Root Directory**: `backend` (Edit 클릭하여 입력)
4. **Environment Variables** 에 아래 2개 추가:
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_SERVICE_KEY` = Supabase service_role key
5. **"Deploy"** 클릭!
6. 배포 완료 후 나오는 URL을 메모

### 8-3. Frontend에 Backend URL 연결

1. Vercel에서 Frontend 프로젝트 선택
2. **Settings** > **Environment Variables**
3. 추가: `VITE_API_URL` = Backend 배포 URL (예: `https://backend-xxxx.vercel.app`)
4. **Redeploy** 실행

---

## 완성된 프로젝트 구조

```
letsStudySaaS/
├── frontend/                        # React + Vite
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js          # Supabase 연결
│   │   ├── components/
│   │   │   ├── Layout.jsx           # 네비게이션 바
│   │   │   ├── CreatePost.jsx       # 게시물 작성
│   │   │   └── PostCard.jsx         # 게시물 카드
│   │   ├── pages/
│   │   │   ├── Login.jsx            # 로그인/회원가입
│   │   │   ├── Feed.jsx             # 피드 (전체 게시물)
│   │   │   └── Profile.jsx          # 프로필 (내 게시물)
│   │   ├── App.jsx                  # 라우팅
│   │   ├── App.css                  # 스타일
│   │   ├── index.css                # 기본 스타일
│   │   └── main.jsx                 # 진입점
│   ├── .env                         # 환경변수 (Git 제외)
│   └── package.json
├── backend/                         # Flask + Swagger
│   ├── app.py                       # API 서버
│   ├── requirements.txt             # Python 패키지
│   ├── vercel.json                  # Vercel 배포 설정
│   └── .env                         # 환경변수 (Git 제외)
├── .gitignore
└── instruction.md                   # 이 파일!
```

---

## 문제 해결 (FAQ)

### Q: 회원가입 후 로그인이 안 돼요
**A**: Supabase > Authentication > Providers > Email > "Confirm email"이 OFF인지 확인하세요.

### Q: 게시물 작성 시 에러가 발생해요
**A**: Supabase > Table Editor에서 `posts` 테이블이 존재하는지 확인하세요. SQL을 다시 실행해보세요.

### Q: 이미지 업로드가 안 돼요
**A**: Supabase > Storage > Policies에서 3개 정책(SELECT, INSERT, DELETE)이 모두 추가되었는지 확인하세요.

### Q: `npm run dev` 실행 시 에러가 발생해요
**A**: `frontend/.env` 파일이 있는지, `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 값이 올바른지 확인하세요.

### Q: `python app.py` 실행 시 에러가 발생해요
**A**: 가상환경이 활성화되어 있는지 확인하세요 (`venv\Scripts\activate`). `backend/.env` 파일도 확인하세요.

### Q: Swagger 페이지가 안 열려요
**A**: Backend 서버가 실행 중인지 확인하세요. http://localhost:5000/docs 로 접속하세요.
