# Corpers Connect — Frontend Implementation Progress

**Project:** `corpers-connect-users` (Next.js 15 PWA)
**Last Updated:** 2026-03-25
**Overall Status:** ✅ Phase 3 Complete — Stories Live

---

## Summary

| Metric | Value |
|---|---|
| Total Phases | 12 |
| Completed Phases | 3 |
| In Progress | Phase 4 (Messaging) |
| Test Suites | 14 |
| Unit Tests | 74 |
| Integration Tests | 50 |
| Total Tests | 124 / 124 ✅ |
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

## Phase 2 — Feed & Posts ✅ COMPLETE

**Goal:** Real posts from the backend, create post modal, like/comment, image upload.

---

### API Layer ✅
- [x] `src/lib/api/feed.ts` — `getFeed` with cursor pagination
- [x] `src/lib/api/posts.ts` — full CRUD + reactions + comments + bookmarks + report + Cloudinary upload

### Components ✅
- [x] `PostCard` — full card with author info, visibility badge, edited flag, reactions summary
- [x] `PostCardSkeleton` — shimmer skeleton loader (3 cards on initial load)
- [x] `MediaGrid` — 1–4 image grid with lightbox viewer, +N overflow badge
- [x] `ReactionBar` — like/love/fire/clap with optimistic UI, long-press opens picker
- [x] `ReactionPicker` — animated emoji picker overlay (400ms long-press trigger)
- [x] `CommentSheet` — bottom sheet with infinite scroll, reply threading (2 levels), send
- [x] `CommentItem` — author avatar, content, reply button, delete (own), nested replies toggle
- [x] `PostMenu` — 3-dot dropdown: bookmark/unbookmark, edit (own), delete (own), report (others)
- [x] `ReportModal` — radio reason selector + optional details textarea
- [x] `CreatePostModal` — text + image upload (Cloudinary), visibility selector, char counter
- [x] `InfiniteFeed` — TanStack Query `useInfiniteQuery`, IntersectionObserver sentinel, error/empty/end states
- [x] `FeedSection` — updated to use InfiniteFeed + CreatePostModal (driven by Zustand)

### Features ✅
- [x] Infinite scroll feed (`GET /feed` cursor pagination)
- [x] Create post (text + images, Cloudinary upload, visibility control)
- [x] Edit post (own posts only, 15-minute server-side window)
- [x] Delete post (own posts only, optimistic removal)
- [x] React to post: LIKE / LOVE / FIRE / CLAP (optimistic UI + long-press picker)
- [x] Remove reaction (tap own reaction)
- [x] Comments — infinite scroll, post/delete, 2-level threading
- [x] Bookmark / unbookmark (optimistic UI in both ReactionBar and PostMenu)
- [x] Report post (modal with reason + details)
- [x] Share post (native Web Share API with clipboard fallback)
- [x] Image lightbox viewer

### Tests ✅ 100 / 100 Passing

| Suite | Type | Tests | Status |
|---|---|---|---|\
| `utils.test.ts` | Unit | 17 | ✅ |
| `validators.test.ts` | Unit | 14 | ✅ |
| `OtpInput.test.tsx` | Unit | 8 | ✅ |
| `PasswordInput.test.tsx` | Unit | 7 | ✅ |
| `PostCard.test.tsx` | Unit | 14 | ✅ |
| `PostCardSkeleton.test.tsx` | Unit | 3 | ✅ |
| `CommentItem.test.tsx` | Unit | 8 | ✅ |
| `login.test.tsx` | Integration | 7 | ✅ |
| `register.test.tsx` | Integration | 6 | ✅ |
| `feed.test.tsx` | Integration | 7 | ✅ |
| `createPost.test.tsx` | Integration | 9 | ✅ |
| **Total** | | **100** | **✅ All Pass** |

### Technical Notes
- `getInitials(firstName, lastName)` — two-arg signature; all new components pass args separately
- Media upload in `CreatePostModal` — proxied through backend `POST /api/v1/media/upload` (server-side signed Cloudinary upload). Requires no Cloudinary env vars on frontend. Backend module added: `src/modules/media/media.{controller,routes}.ts`.
- `IntersectionObserver` used for infinite scroll sentinel (200px root margin)
- `staleTime: 2min` on feed query — prevents excessive re-fetches on section tab-switch
- Reaction optimistic update: correct count math (adding first reaction vs changing type vs removing)
- Edit post: `CreatePostModal` accepts optional `editPost` prop — bypasses Zustand state, uses `onClose` callback
- All mutations invalidate `queryKeys.feed()` + `queryKeys.post(id)` on settle
- Modal backdrops use `bg-black/70` (increased from 45–50%) to eliminate white-bar bleed-through from TopBar and page background

### Video / Reel Support (Backend Confirmed)
- Backend supports image AND video uploads (max 50 MB) for Stories (`POST /api/v1/stories`) and Reels (`POST /api/v1/reels`) — both use `multipart/form-data` with a `media` field
- `resource_type: 'auto'` on Cloudinary — auto-detects image vs video, returns `mediaType` in response
- Video integration deferred to Phase 3 (Stories) and future Reels phase

---

## Phase 3 — Stories ✅ COMPLETE

**Goal:** Stories tray on feed, full-screen viewer, story creation (image + video), view tracking.

---

### API Layer ✅
- [x] `src/lib/api/stories.ts` — `getStories`, `createStory`, `viewStory`, `deleteStory`, `getUserHighlights`
- [x] Normalises backend `{ viewed, _count }` → `{ isViewed, viewCount }` for the frontend `Story` type
- [x] `createStory` sends multipart/form-data directly to backend (server-side Cloudinary upload, same pattern as posts)

### Components ✅
- [x] `StoryRing` — avatar with colored ring (green gradient = has unviewed, gray = all viewed), + badge for "Add Story"
- [x] `StoryTray` — horizontal scroll strip; "Your Story / Add Story" always first, followed by other users
- [x] `StoryProgress` — segmented progress bars (one per story in the group); fills completed bars, animates active bar
- [x] `StoryViewer` — full-screen portal viewer:
  - React Portal via `ClientPortal` + `useBodyScrollLock` (no white-bar or scroll issues)
  - Progress bars with 5-second auto-advance (images) or `onEnded` trigger (videos)
  - Tap left third = previous, tap right third = next; keyboard arrow key + Escape support
  - Hold (pointerDown) pauses the timer
  - Author header with avatar, name, timestamp
  - View count badge (own stories only)
  - Delete with confirmation (own stories only)
  - "Add to story" CTA when viewing own group
  - Black gradient overlays (top + bottom) for readability
  - Desktop chevron navigation arrows
- [x] `StoryCreator` — upload modal (React Portal + body scroll lock):
  - Image and video support (accept="image/*,video/*", max 50 MB)
  - Live preview (video: `<video>` tag; image: Next.js `<Image>`)
  - Caption input (max 200 chars)
  - Backend multipart upload → Cloudinary server-side
  - Optimistic query invalidation on success

### Integration ✅
- [x] `FeedSection` — `<StoryTray>` rendered in a card above the create-post card
- [x] View story marked via `POST /stories/:id/view` (idempotent, not called for own stories)
- [x] Delete story refreshes stories cache via `queryClient.invalidateQueries`

### MSW Test Fixtures ✅
- [x] `mockStory` + `mockStoryGroup` added to `handlers.ts`
- [x] Handlers: `GET /stories`, `POST /stories`, `POST /stories/:id/view`, `DELETE /stories/:id`, `GET /stories/users/:userId/highlights`

### Tests ✅ 124 / 124 Passing

| Suite | Type | Tests | Status |
|---|---|---|---|
| `utils.test.ts` | Unit | 17 | ✅ |
| `validators.test.ts` | Unit | 14 | ✅ |
| `OtpInput.test.tsx` | Unit | 8 | ✅ |
| `PasswordInput.test.tsx` | Unit | 7 | ✅ |
| `PostCard.test.tsx` | Unit | 14 | ✅ |
| `PostCardSkeleton.test.tsx` | Unit | 3 | ✅ |
| `CommentItem.test.tsx` | Unit | 8 | ✅ |
| `StoryRing.test.tsx` | Unit | 8 | ✅ |
| `StoryProgress.test.tsx` | Unit | 5 | ✅ |
| `login.test.tsx` | Integration | 7 | ✅ |
| `register.test.tsx` | Integration | 6 | ✅ |
| `feed.test.tsx` | Integration | 7 | ✅ |
| `createPost.test.tsx` | Integration | 9 | ✅ |
| `stories.test.tsx` | Integration | 11 | ✅ |
| **Total** | | **124** | **✅ All Pass** |

### Technical Notes
- `StoryViewer` uses the same `ClientPortal` + `useBodyScrollLock` pattern as `CreatePostModal` — modals render to `#modal-root` and escape TopBar's stacking context
- Image auto-advance uses `setInterval` with 50ms ticks (100 steps over 5 seconds) for smooth progress animation
- Video auto-advance uses the `<video onEnded>` event and `onTimeUpdate` to drive the progress bar
- `markViewed` uses a `useRef<Set<string>>` to deduplicate view events within a single viewer session (API is idempotent via `upsert` but avoids unnecessary requests)
- Story groups are sorted: own group first (if exists), others by backend order (most-recently-created first)
- Skeleton placeholders (3× `animate-pulse` rings) shown while stories are loading

---

## Phase 4 — Messaging 🔴 Not Started
## Phase 5 — Notifications 🔴 Not Started
## Phase 6 — Profile 🔴 Not Started
## Phase 7 — Marketplace 🔴 Not Started
## Phase 8 — Opportunities 🔴 Not Started
## Phase 9 — Subscription & Payments 🔴 Not Started
## Phase 10 — Calls 🔴 Not Started
## Phase 11 — Settings & 2FA Management 🔴 Not Started
## Phase 12 — E2E Tests & PWA Audit 🔴 Not Started
