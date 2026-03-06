-- MiniGram Supabase Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. posts 테이블 생성
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. likes 테이블 생성
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

-- 4. Posts 정책: 누구나 읽기 가능, 본인만 쓰기/삭제
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- 5. Likes 정책: 누구나 읽기 가능, 본인만 좋아요/취소
CREATE POLICY "Anyone can read likes"
  ON likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- 6. Storage bucket 생성 (Supabase Dashboard > Storage에서 생성해도 됨)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- 7. Storage 정책 (Dashboard > Storage > post-images > Policies에서 설정)
-- SELECT: public access (anyone can view)
-- INSERT: authenticated users only
-- DELETE: owner only
