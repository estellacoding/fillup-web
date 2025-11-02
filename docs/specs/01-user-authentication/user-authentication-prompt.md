# User Authentication Spec

## 功能概述
實現 FillUp! 的用戶認證系統，包含註冊、登入、登出功能。使用 NextAuth.js 提供安全且符合隱私原則的認證流程。

## 用戶旅程

### 主要旅程（P0）
1. **新用戶註冊流程**
   - 訪客進入首頁 → 點擊「開始使用」
   - 填寫 Email 與密碼（或使用 OAuth）
   - 驗證 Email 信箱
   - 自動導向目標設定頁面

2. **現有用戶登入流程**
   - 訪客進入登入頁
   - 輸入 Email 與密碼（或使用 OAuth）
   - 登入成功後導向主儀表板

3. **用戶登出流程**
   - 用戶點擊「登出」按鈕
   - 清除 Session，導回登入頁

## 技術要求

### 技術棧（參考 tech.md）
- **認證框架**: NextAuth.js (Auth.js)
- **資料庫**: PostgreSQL + Prisma ORM
- **密碼加密**: bcrypt
- **Session 管理**: JWT (開發環境) / Database Session (生產環境)

### 認證方式（Phase 1）
1. **Email + Password** (必須)
2. **Google OAuth** (選配，優先實作)
3. **Email Magic Link** (選配，Phase 2)

## 資料模型（參考 structure.md）

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // OAuth 用戶可為 null
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts      Account[]
  sessions      Session[]
  goal          Goal?
  waterLogs     WaterLog[]
  achievements  UserAchievement[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## API 端點

### NextAuth.js Routes (自動生成)
```
POST   /api/auth/signin           # 登入
POST   /api/auth/signout          # 登出
GET    /api/auth/session          # 取得 Session
POST   /api/auth/callback/[provider]  # OAuth 回調
GET    /api/auth/csrf             # CSRF Token
```

### 自訂 API
```
POST   /api/auth/register         # 註冊新用戶
POST   /api/auth/verify-email     # 驗證 Email
GET    /api/auth/me               # 取得當前用戶資訊
```

## 組件結構（參考 structure.md）

```
app/
├── (auth)/                       # 認證路由群組
│   ├── login/
│   │   └── page.tsx             # 登入頁面
│   ├── register/
│   │   └── page.tsx             # 註冊頁面
│   └── layout.tsx               # 認證頁面共用佈局
│
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts         # NextAuth.js 配置
│       ├── register/
│       │   └── route.ts         # 註冊 API
│       └── me/
│           └── route.ts         # 當前用戶 API
│
components/
├── features/
│   └── auth/
│       ├── LoginForm.tsx        # 登入表單
│       ├── RegisterForm.tsx     # 註冊表單
│       ├── OAuthButtons.tsx     # OAuth 按鈕組
│       └── ProtectedRoute.tsx   # 受保護路由組件
│
lib/
├── auth.ts                      # NextAuth 配置
└── hooks/
    └── useAuth.ts               # 認證 Hook
```

## 實作細節

### 1. NextAuth 配置 (lib/auth.ts)
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('請輸入 Email 與密碼')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('Email 或密碼錯誤')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Email 或密碼錯誤')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
```

### 2. 註冊 API (app/api/auth/register/route.ts)
```typescript
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email 格式錯誤'),
  password: z.string().min(8, '密碼至少 8 個字元'),
  name: z.string().optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // 檢查 Email 是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_EXISTS', message: 'Email 已被使用' } },
        { status: 409 }
      )
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 12)

    // 建立用戶
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: '註冊成功'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '註冊失敗，請稍後再試' } },
      { status: 500 }
    )
  }
}
```

### 3. 登入頁面組件 (app/(auth)/login/page.tsx)
```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('登入失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">FillUp!</h1>
          <p className="mt-2 text-gray-600">登入您的帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">或</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          使用 Google 登入
        </Button>

        <p className="text-center text-sm">
          還沒有帳號？{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            立即註冊
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### 4. useAuth Hook (lib/hooks/useAuth.ts)
```typescript
import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated'
  }
}
```

## 環境變數

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (選配)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fillup
```

## 驗收標準

### 功能驗收
- [ ] 用戶可以使用 Email + Password 註冊
- [ ] 用戶可以使用 Email + Password 登入
- [ ] 用戶可以使用 Google OAuth 登入
- [ ] 用戶可以登出
- [ ] 密碼使用 bcrypt 加密儲存
- [ ] 未登入用戶訪問受保護頁面會導向登入頁
- [ ] 已登入用戶訪問登入頁會導向儀表板

### 安全性驗收
- [ ] 密碼長度至少 8 個字元
- [ ] 密碼加密使用 bcrypt (salt rounds >= 12)
- [ ] Session 使用 JWT 或 Database Session
- [ ] CSRF 保護已啟用
- [ ] 敏感錯誤訊息不外洩（如：不顯示「用戶不存在」）

### 效能驗收
- [ ] 登入/註冊 API 回應時間 < 500ms
- [ ] Session 驗證時間 < 100ms

### UX 驗收
- [ ] 表單驗證即時回饋
- [ ] 載入狀態明確顯示
- [ ] 錯誤訊息清楚易懂
- [ ] 成功登入後自動導向儀表板

## 測試策略

### 單元測試
- 註冊 API 邏輯測試
- 密碼加密驗證
- Email 格式驗證

### 整合測試
- NextAuth 認證流程測試
- OAuth 回調測試
- Session 管理測試

### E2E 測試
- 完整註冊流程
- 完整登入流程
- 登出流程

## 參考文件
- NextAuth.js 官方文件: https://next-auth.js.org/
- Prisma Adapter: https://authjs.dev/reference/adapter/prisma
- FillUp! Tech Stack: `.kiro/steering/tech.md`
- FillUp! Project Structure: `.kiro/steering/structure.md`
