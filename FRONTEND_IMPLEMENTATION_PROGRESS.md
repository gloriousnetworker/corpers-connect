# Corpers Connect — Frontend Implementation Progress

**Project:** `corpers-connect-users` (Next.js 15 PWA)
**Last Updated:** 2026-03-25
**Overall Status:** ✅ Phase 1 Complete & Deployed — Ready for Phase 2

---

## Summary

| Metric | Value |
|---|---|
| Total Phases | 12 |
| Completed Phases | 1 |
| In Progress | Phase 2 (Feed & Posts) |
| Test Suites | 6 |
| Unit Tests | 46 |
| Integration Tests | 13 |
| Total Tests | 59 / 59 ✅ |
| E2E Tests | 0 (Phase 12) |
| Build Status | ✅ exit 0, no warnings |
| Vercel Deployment | ✅ Live at corpersconnectapp.vercel.app |

---

## Phase 1 — Foundation, Auth & Dashboard Shell ✅ COMPLETE

**Goal:** App boots, design system configured, auth flows work end-to-end, users land on a properly laid-out SPA dashboard.

---

### Setup & Config ✅
- [x] Next.js 15 App Router with TypeScript strict mode
- [x] TanStack Query, Zustand, Framer Motion, Zod, React Hook Form, Axios, Sonner
- [x] `next.config.mjs` — PWA via `@ducanh2912/next-pwa`, image domains, `output: 'standalone'` removed (caused Vercel build failure)
- [x] `tailwind.config.ts` — NYSC Green `#008751`, Gold `#C8992A`, full design token system
- [x] `globals.css` — 16px input font-size iOS zoom fix, safe-area utilities, `overscroll-behavior: none` on html+body, `overflow: hidden` on html+body (prevents iOS rubber-band bounce)
- [x] Path aliases (`@/*` → `src/*`), Jest + RTL + MSW configured

---

### PWA ✅
- [x] `public/manifest.json` — full PWA manifest, `start_url: "/"`, all icon sizes
- [x] Icons regenerated from `public/logo.png` via Sharp — all sizes 32→512px with green `#008751` background, apple-touch-icon included
- [x] Service worker via `@ducanh2912/next-pwa` (disabled in dev, runtime caching for API + Cloudinary)
- [x] `SplashScreen` — Framer Motion scale+fade, 1.6s, NYSC green, logo centered responsive
- [x] `InstallPrompt` — bottom sheet, Android native prompt + iOS step-by-step instructions
  - Fixed: `bottom-sheet` CSS `translateX(-50%)` conflicted with Framer Motion `y` animation (split sheet bug). Now uses `left:0 right:0 mx-auto` centering.
  - Logo: uses `/icons/icon-192x192.png` (proper PWA icon, not broken path)
- [x] `usePWAInstall` hook — captures `beforeinstallprompt`, 7-day cooldown per device

---

### Types, Constants & Utilities ✅
- [x] `src/types/enums.ts`, `models.ts`, `api.ts`
- [x] `src/lib/constants.ts` — API URLs, storage keys, subscription configs
- [x] `src/lib/utils.ts` — cn, formatPrice, formatCount, formatRelativeTime, maskEmail, getInitials
- [x] `src/lib/validators.ts` — all Zod schemas (login, register, forgot/reset password, 2FA, onboarding)
- [x] `src/lib/query-keys.ts` — type-safe query key factory

---

### API Layer ✅
- [x] `src/lib/api/client.ts` — Axios instance with silent token refresh interceptor (401 → refresh → retry)
- [x] `src/lib/api/auth.ts` — login, register, verify OTP, forgot/reset password, 2FA challenge, onboarding
- [x] `src/lib/api/users.ts` — user profile functions

---

### State ✅
- [x] `src/store/auth.store.ts` — Zustand with persist (user data only, tokens never stored in localStorage)
- [x] `src/store/ui.store.ts` — `activeSection` (SPA nav), modals, registration/reset flow state, unread badges

---

### Providers & Middleware ✅
- [x] `src/providers/QueryProvider.tsx`
- [x] `src/providers/AuthProvider.tsx` — silent session restore on mount
- [x] `src/providers/Providers.tsx` — ThemeProvider + QueryProvider + AuthProvider + Sonner Toaster
- [x] `src/middleware.ts` — `cc_session` cookie-based route protection
  - Root `/` → authenticated: serve dashboard; unauthenticated: redirect to `/login`
  - Auth pages → redirect authenticated users to `/`
  - Protected pages → redirect unauthenticated users to `/login?next=...`

---

### Layout & Navigation ✅
- [x] `src/app/layout.tsx` — root layout, Plus Jakarta Sans, PWA meta, `app-container` wrapper removed (was capping desktop at 480px)
- [x] `src/app/(auth)/layout.tsx` — centered column, no shell
- [x] `src/app/(onboarding)/layout.tsx`
- [x] `src/app/(app)/layout.tsx` — wraps with AppShell
- [x] `src/app/(app)/page.tsx` — server component importing `Dashboard` client component (fixes Vercel `page_client-reference-manifest.js` build error)
- [x] `src/components/dashboard/Dashboard.tsx` — `'use client'` SPA router; renders active section; `py-3` breathing room below TopBar
- [x] `src/components/layout/AppShell.tsx` — flex-row model (waec-cbt-simulator pattern):
  - `h-dvh overflow-hidden` container prevents viewport-level bounce
  - Sticky sidebar (desktop) + `flex-1 overflow-y-auto overscroll-y-none` center + sticky right panel (xl+)
  - No manual `ml-64 mr-80` margin shifts
- [x] `src/components/layout/DesktopSideNav.tsx` — `hidden lg:flex sticky top-0 h-dvh`, state-based `onClick` nav (no Next.js Link/route changes)
- [x] `src/components/layout/BottomNav.tsx` — 5-tab fixed mobile nav with unread badges
- [x] `src/components/layout/TopBar.tsx` — fixed mobile bar, `lg:hidden`, bell → notifications section
- [x] `src/components/layout/RightPanel.tsx` — xl+ sticky right column (placeholder: suggested corpers, trending)
- [x] `src/components/shared/Logo.tsx` — full (`corpersconnectlogo.jpg`) and mark (`icon-192x192.png`) variants

---

### SPA Dashboard Sections ✅
All sections load inside the dashboard at URL `/` — no route changes, no browser history entries.

- [x] `FeedSection` — create-post card + empty feed placeholder
- [x] `DiscoverSection` — search bar + category grid (6 categories)
- [x] `NotificationsSection` — header + empty state + "Mark all read"
- [x] `MessagesSection` — header + search + empty state
- [x] `ProfileSection` — cover + avatar + stats (posts/followers/following) + settings + sign out

---

### Auth Screens ✅
Full flow: Register → OTP → Verify → Login → 2FA → Onboarding → Dashboard.

| Route | Screen | Status |
|---|---|---|
| `/login` | Email/state code + password, 2FA redirect, forgot link | ✅ |
| `/register` | Step 1: NYSC state code + password with strength | ✅ |
| `/register/confirm` | Step 2: OTP verification | ✅ |
| `/register/verify` | Step 3: NYSC data confirmation + proceed | ✅ |
| `/forgot-password` | Email entry → OTP dispatch | ✅ |
| `/reset-password` | OTP + new password + confirm | ✅ |
| `/2fa` | TOTP 6-digit entry, auto-redirect if no challenge data | ✅ |
| `/onboarding` | Bio + Corper Tag toggle, skippable | ✅ |

**Redirect chain verified:**
- Unauthenticated → `/login` → login success → `/` (via `/feed` redirect in login, middleware serves `/`)
- 2FA required → `/2fa` → verify → `/`
- New user → `/onboarding` → complete → `/`

---

### UI Primitives ✅
- [x] `Button` — CVA variants (primary/secondary/ghost/danger), isLoading, fullWidth, icon slots
- [x] `Input` — label, error, hint, leftIcon, rightElement, 16px font-size enforcement
- [x] `Badge` — level badges (otondo/kopa/corper) with gold accent for CORPER
- [x] `Skeleton` — shimmer base + PostCardSkeleton, AvatarSkeleton, TextSkeleton variants
- [x] `OtpInput` — 6-box, auto-advance on digit, backspace navigation, paste support
- [x] `PasswordInput` — eye toggle, optional 4-bar strength indicator

---

### Tests ✅ 59 / 59 Passing

| Suite | Type | Tests | Status |
|---|---|---|---|
| `utils.test.ts` | Unit | 17 | ✅ |
| `validators.test.ts` | Unit | 14 | ✅ |
| `OtpInput.test.tsx` | Unit | 8 | ✅ |
| `PasswordInput.test.tsx` | Unit | 7 | ✅ |
| `login.test.tsx` | Integration | 7 | ✅ |
| `register.test.tsx` | Integration | 6 | ✅ |
| **Total** | | **59** | **✅ All Pass** |

> `console.error` warnings in test output are pre-existing, test-environment-only issues (Next.js Image mock passing `fill`/`priority` as DOM attributes, PasswordInput receiving `value` without `onChange` in unit test assertions). None affect test results.

---

### Build & Deployment ✅

- [x] `npm run build` — exit 0, no errors, no ENOENT warnings
- [x] **Root cause of Vercel build failure fixed:** `src/app/page.tsx` and `src/app/(app)/page.tsx` both mapped to `/` (route conflict → `page_client-reference-manifest.js` ENOENT). Deleted conflicting root `page.tsx`.
- [x] `output: 'standalone'` removed — Vercel doesn't need it; it was causing fatal trace errors for server-component pages
- [x] Deployed to `corpersconnectapp.vercel.app` ✅

---

### Known Console Warnings (Non-Blocking)

| Warning | Location | Impact |
|---|---|---|
| `fill`/`priority` non-boolean DOM attrs | Test setup (Next.js Image mock) | Tests only, not production |
| `value` without `onChange` on PasswordInput | Unit test assertions | Tests only |
| Multiple lockfiles (workspace root inference) | Next.js 15 build | Warning only, build succeeds |

---

## Route Sync Audit ✅

All routes verified wired correctly:

```
/                    → Dashboard (authenticated) | /login (unauthenticated)
/login               → LoginPage (/feed or next param on success)
/register            → RegisterPage step 1
/register/confirm    → OTP step (requires registration state in Zustand)
/register/verify     → Success step (requires nyscData in Zustand)
/forgot-password     → ForgotPasswordPage
/reset-password      → ResetPasswordPage (requires otpToken in Zustand)
/2fa                 → TwoFAPage (requires challengeToken in Zustand, redirects if missing)
/onboarding          → OnboardingPage
/discover            → redirect('/')
/feed                → redirect('/')
/messages            → redirect('/')
/notifications       → redirect('/')
/profile             → redirect('/')
```

---

## Phase 2 — Feed & Posts 🔴 Not Started

**Goal:** Real posts from the backend, create post modal, like/comment, image upload.

Planned features:
- [ ] `GET /posts` — infinite scroll feed with TanStack Query `useInfiniteQuery`
- [ ] `POST /posts` — create post modal (text + image, Cloudinary upload)
- [ ] Like / unlike (optimistic UI)
- [ ] Comment thread (basic, collapsible)
- [ ] Post card component with skeleton loading
- [ ] Empty feed → suggest connections

---

## Phase 3 — Stories 🔴 Not Started
## Phase 4 — Messaging 🔴 Not Started
## Phase 5 — Notifications 🔴 Not Started
## Phase 6 — Profile 🔴 Not Started
## Phase 7 — Marketplace 🔴 Not Started
## Phase 8 — Opportunities 🔴 Not Started
## Phase 9 — Subscription & Payments 🔴 Not Started
## Phase 10 — Calls 🔴 Not Started
## Phase 11 — Settings & 2FA Management 🔴 Not Started
## Phase 12 — E2E Tests & PWA Audit 🔴 Not Started
