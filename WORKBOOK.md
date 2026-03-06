# MiniGram 워크북 - 2시간 만에 SNS 웹앱 만들기

인스타그램 스타일의 간단한 SNS 웹앱을 만들면서 Frontend, Backend, Deploy 개념을 배워봅시다.

---

## 목차

1. [사전 준비](#1-사전-준비) (10분)
2. [Supabase 설정](#2-supabase-설정) (15분)
3. [Backend 실행하기](#3-backend-실행하기) (20분)
4. [Frontend 실행하기](#4-frontend-실행하기) (20분)
5. [코드 이해하기](#5-코드-이해하기) (30분)
6. [Vercel 배포하기](#6-vercel-배포하기) (15분)
7. [마무리 및 확장](#7-마무리-및-확장) (10분)

---

## 1. 사전 준비

### 필요한 도구 설치

| 도구 | 용도 | 설치 확인 |
|------|------|-----------|
| Node.js (18+) | Frontend 실행 | `node --version` |
| Python (3.9+) | Backend 실행 | `python --version` |
| Git | 버전 관리 | `git --version` |

### 프로젝트 구조 이해

```
letsStudySaaS/
├── frontend/          # React + Vite (화면)
│   ├── src/
│   │   ├── components/  # 재사용 가능한 UI 조각
│   │   ├── pages/       # 페이지 단위 화면
│   │   ├── lib/         # 유틸리티 (Supabase 연결)
│   │   ├── App.jsx      # 앱의 진입점
│   │   └── App.css      # 스타일
│   └── package.json
├── backend/           # Flask + Swagger (API 서버)
│   ├── app.py           # API 서버 코드
│   ├── requirements.txt # Python 패키지 목록
│   └── vercel.json      # Vercel 배포 설정
├── supabase-schema.sql  # 데이터베이스 스키마
└── PRD.md               # 요구사항 명세서
```

### 핵심 개념 정리

- **Frontend (React/Vite)**: 사용자가 보는 화면. 브라우저에서 실행됨
- **Backend (Flask)**: 데이터를 처리하는 서버. API를 제공
- **Swagger**: API 문서를 자동으로 만들어주는 도구
- **Supabase**: 데이터베이스 + 인증 + 파일 저장소를 제공하는 서비스
- **Vercel**: 코드를 인터넷에 배포하는 서비스

---

## 2. Supabase 설정

### Step 1: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 접속하여 회원가입/로그인
2. "New Project" 클릭
3. 프로젝트 이름: `minigram`
4. Database Password 설정 (기억해두세요!)
5. Region: `Northeast Asia (Tokyo)` 선택
6. "Create new project" 클릭 후 약 2분 대기

### Step 2: 테이블 생성

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. "New Query" 클릭
3. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 클릭

```sql
-- posts 테이블: 게시물 저장
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- likes 테이블: 좋아요 저장
CREATE TABLE likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

> **배울 점**: `REFERENCES`는 외래키(Foreign Key)로, 테이블 간의 관계를 정의합니다.
> `UNIQUE(post_id, user_id)`는 한 사용자가 같은 게시물에 중복 좋아요를 방지합니다.

### Step 3: Storage 설정 (이미지 업로드용)

1. 왼쪽 메뉴에서 **Storage** 클릭
2. "New bucket" 클릭
3. 이름: `post-images`, **Public bucket** 체크
4. "Create bucket" 클릭
5. 생성된 버킷 클릭 > **Policies** 탭
6. 아래 정책 추가:
   - SELECT: `true` (누구나 이미지 조회 가능)
   - INSERT: `auth.role() = 'authenticated'` (로그인한 사용자만 업로드)

### Step 4: API 키 확인

1. 왼쪽 메뉴 **Settings** > **API**
2. 아래 두 값을 메모:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (긴 문자열)
   - **service_role key**: Backend용 (절대 프론트엔드에 노출하지 마세요!)

---

## 3. Backend 실행하기

### Step 1: Python 가상환경 생성 및 패키지 설치

```bash
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

### Step 2: 환경변수 설정

```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env
```

`.env` 파일을 열어 Supabase 정보 입력:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Step 3: 서버 실행

```bash
python app.py
```

성공하면 아래 메시지가 표시됩니다:
```
 * Running on http://127.0.0.1:5000
```

### Step 4: Swagger API 문서 확인

브라우저에서 `http://localhost:5000/docs` 접속!

> **배울 점**: Swagger UI에서 API를 직접 테스트할 수 있습니다.
> 각 엔드포인트의 요청/응답 형식을 한눈에 볼 수 있어요.

### Backend 코드 핵심 해설

```python
# Flask 앱 생성
app = Flask(__name__)

# CORS 설정 - Frontend에서 Backend로 요청을 보낼 수 있게 허용
CORS(app)

# Swagger API 문서 자동 생성
api = Api(app, doc='/docs')

# RESTful 엔드포인트 정의
@ns_posts.route('/')
class PostList(Resource):
    def get(self):        # GET /api/posts/ - 게시물 목록 조회
    def post(self):       # POST /api/posts/ - 새 게시물 생성
```

> **REST API란?** URL + HTTP 메서드로 데이터를 CRUD 하는 규약
> - GET: 조회 (Read)
> - POST: 생성 (Create)
> - DELETE: 삭제 (Delete)

---

## 4. Frontend 실행하기

### Step 1: 패키지 설치

```bash
cd frontend
npm install
```

### Step 2: 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 Supabase 정보 입력:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:5000
```

> **주의**: Frontend에서는 반드시 `anon` 키를 사용하세요. `service_role` 키는 절대 안 됩니다!

### Step 3: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

### Step 4: 기능 테스트

1. **회원가입**: Sign Up 버튼 클릭 > 이메일/비밀번호 입력
2. **로그인**: 가입한 계정으로 로그인
3. **게시물 작성**: 텍스트 입력 후 Post 클릭
4. **이미지 업로드**: Photo 버튼으로 이미지 첨부
5. **좋아요**: 하트 아이콘 클릭
6. **프로필**: 상단 Profile 링크로 내 게시물 확인

---

## 5. 코드 이해하기

### 5-1. React 컴포넌트 구조

```
App.jsx (라우팅)
├── Login.jsx (로그인/회원가입)
├── Layout.jsx (상단 네비게이션)
│   ├── Feed.jsx (피드 페이지)
│   │   ├── CreatePost.jsx (게시물 작성)
│   │   └── PostCard.jsx (게시물 카드)
│   └── Profile.jsx (프로필 페이지)
│       └── PostCard.jsx (재사용!)
```

> **배울 점**: React에서는 UI를 **컴포넌트** 단위로 쪼개서 재사용합니다.
> PostCard는 Feed와 Profile 양쪽에서 재사용됩니다!

### 5-2. React Router - 페이지 이동

```jsx
// App.jsx
<Router>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Feed />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</Router>
```

> URL에 따라 다른 컴포넌트를 보여주는 것이 **라우팅**입니다.

### 5-3. useState - 상태 관리

```jsx
const [posts, setPosts] = useState([])
// posts: 현재 값
// setPosts: 값을 변경하는 함수
// []: 초기값 (빈 배열)
```

> React에서 화면에 표시할 데이터를 **state(상태)**로 관리합니다.
> state가 바뀌면 화면이 자동으로 다시 그려집니다!

### 5-4. useEffect - 데이터 불러오기

```jsx
useEffect(() => {
  fetchPosts()  // 컴포넌트가 화면에 나타날 때 게시물 목록을 불러옴
}, [])          // [] = 처음 한 번만 실행
```

### 5-5. Supabase 쿼리

```javascript
// 게시물 목록 조회 (좋아요 데이터 포함)
const { data } = await supabase
  .from('posts')                              // posts 테이블에서
  .select('*, likes(user_id)')                // 모든 컬럼 + likes 관계 데이터
  .order('created_at', { ascending: false })  // 최신순 정렬

// 게시물 작성
await supabase.from('posts').insert({
  user_id: session.user.id,
  content: 'Hello World!',
})
```

### 5-6. Flask API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/posts/` | 전체 게시물 목록 |
| POST | `/api/posts/` | 새 게시물 작성 |
| GET | `/api/posts/<id>` | 특정 게시물 조회 |
| DELETE | `/api/posts/<id>` | 게시물 삭제 |
| POST | `/api/likes/` | 좋아요 |
| DELETE | `/api/likes/<post_id>/<user_id>` | 좋아요 취소 |

---

## 6. Vercel 배포하기

### Step 1: GitHub 저장소 생성

1. [github.com](https://github.com)에서 "New Repository" 클릭
2. Repository name: `letsStudySaaS`
3. "Create repository" 클릭

```bash
# 프로젝트 루트에서 실행
git add .
git commit -m "Initial commit: MiniGram SNS app"
git remote add origin https://github.com/YOUR_USERNAME/letsStudySaaS.git
git push -u origin main
```

### Step 2: Frontend 배포

1. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인
2. "Add New Project" 클릭
3. GitHub에서 `letsStudySaaS` 저장소 선택
4. 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables** 추가:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. "Deploy" 클릭!

### Step 3: Backend 배포

1. Vercel에서 다시 "Add New Project" 클릭
2. 같은 저장소 선택
3. 설정:
   - **Root Directory**: `backend`
4. **Environment Variables** 추가:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_KEY` = your service role key
5. "Deploy" 클릭!

> 배포된 Backend URL을 Frontend의 `VITE_API_URL` 환경변수에 설정하세요.

---

## 7. 마무리 및 확장

### 완성! 지금까지 배운 것

- **React/Vite**: 컴포넌트 기반 UI 개발, 라우팅, 상태 관리
- **Flask/Swagger**: RESTful API 설계, API 문서화
- **Supabase**: 인증, 데이터베이스, 파일 스토리지
- **Vercel**: 자동 배포 (GitHub push 시 자동 업데이트!)
- **Git/GitHub**: 버전 관리, 협업

### 도전 과제 (추가 학습)

1. **댓글 기능**: comments 테이블을 추가하고 CRUD API 구현
2. **팔로우 기능**: follows 테이블로 사용자 간 관계 구현
3. **프로필 사진**: Storage에 프로필 이미지 업로드 기능 추가
4. **검색 기능**: 게시물 내용 검색 API 구현
5. **다크 모드**: CSS 변수를 활용한 테마 전환

---

## 실행 명령어 요약

### Frontend
```bash
cd frontend
npm install          # 패키지 설치 (최초 1회)
npm run dev          # 개발 서버 실행 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
```

### Backend
```bash
cd backend
python -m venv venv           # 가상환경 생성 (최초 1회)
source venv/bin/activate      # 가상환경 활성화 (Mac/Linux)
# venv\Scripts\activate       # 가상환경 활성화 (Windows)
pip install -r requirements.txt  # 패키지 설치 (최초 1회)
python app.py                 # 서버 실행 (http://localhost:5000)
```
